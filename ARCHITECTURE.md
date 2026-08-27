# tournament-api — Documentación técnica

Plataforma multi-tenant para crear y administrar torneos deportivos. Este documento describe la arquitectura del backend, los módulos existentes, y cómo agregar nuevos modelos siguiendo el mismo patrón.

---

## Visión general

- **Producto:** cada torneo es un "tenant" independiente, con su propio branding y datos. Un usuario puede administrar varios torneos.
- **Dos superficies separadas:** una API privada (admin, con login) y una API pública (sin login, solo lectura) — son proyectos distintos; este documento cubre únicamente la API privada.
- **Escala objetivo:** la plataforma está pensada para soportar miles de usuarios desde el lanzamiento, no como proyecto de bajo tráfico.

### Stack

| Pieza | Tecnología |
|---|---|
| Runtime | Node.js + TypeScript (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) |
| Framework HTTP | Express 5 |
| Base de datos | PostgreSQL (hosteado en Neon) |
| ORM | Drizzle |
| Hash de contraseñas | Argon2id |
| Validación | Zod |
| Logging | Pino |
| Cache / rate limiting | En memoria y Postgres por ahora — Redis planeado para cuando se escale a múltiples instancias |

---

## Arquitectura por capas

Cada módulo de negocio (`auth`, `tournaments`, futuros módulos) sigue la misma estructura de 4 capas, inspirada en arquitectura hexagonal/limpia:

```
src/modules/<módulo>/
├── <módulo>.module.ts        ← composition root: conecta todas las capas
│
├── domain/                   ← el "qué es" y "qué se puede hacer", sin saber "cómo"
│   ├── entities/               tipos e interfaces puras, sin dependencias externas
│   ├── repositories/           interfaces (contratos) de acceso a datos
│   └── errors/                 errores de dominio, extienden AppError
│
├── application/               ← el "cómo se orquesta" un caso de uso
│   ├── ports/                   interfaces de servicios externos (hasher, generador de slug, etc.)
│   └── use-cases/                una clase por acción de negocio (RegisterUser, CreateTournament, etc.)
│
├── infrastructure/            ← el "cómo se implementa" de verdad
│   ├── database/                schema de Drizzle + implementaciones de los repositorios
│   └── <otros>/                  implementaciones de ports (ej. hasher con Argon2, generador de slug)
│
└── presentation/              ← el "cómo entra por HTTP"
    ├── schemas/                  validación de request body con Zod
    ├── utils/                     serializadores (qué campos exponer al cliente)
    ├── middlewares/                (si el módulo los necesita, ej. requireAuth)
    ├── <módulo>.controller.ts
    └── <módulo>.routes.ts
```

### Regla de dependencia (de afuera hacia adentro)

```
presentation → application → domain
infrastructure → domain (implementa sus interfaces)
```

- `domain` no importa nada de las otras capas. Es la única capa que las demás pueden asumir estable.
- `application` conoce las interfaces del `domain`, nunca una implementación concreta de Drizzle o Express.
- `infrastructure` implementa las interfaces del `domain` (repositorios) y del `application` (ports).
- `presentation` traduce HTTP ↔ casos de uso. No contiene lógica de negocio.
- El `<módulo>.module.ts` es el único archivo que conoce las 4 capas a la vez — instancia las implementaciones concretas y las inyecta a mano (sin framework de DI).

### Por qué así

- Los casos de uso se pueden testear sin levantar una base de datos real (se les pasa un repositorio falso que cumple la interfaz).
- Cambiar de proveedor de datos (ej. mover sesiones de Postgres a Redis) es un cambio localizado en `infrastructure/`, sin tocar `domain` ni `application`.
- Un desarrollador nuevo puede entender un módulo completo leyendo sus 4 capas en orden, sin saltar por el resto del proyecto.

---

## Manejo de errores

Todo error de negocio extiende `AppError` (`src/shared/errors/app-error.ts`):

```ts
new AppError(statusCode, code, message)
```

El `error-handler.ts` global (`src/shared/errors/error-handler.ts`) captura:
- `ZodError` → `400 VALIDATION_ERROR` con `details` (issues de Zod)
- `AppError` → el `statusCode`/`code`/`message` que el error defina
- Cualquier otro error → `500 INTERNAL_SERVER_ERROR` (y se loguea, nunca se expone el detalle interno al cliente)

**Formato de respuesta de error, siempre el mismo shape:**
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Texto legible",
    "details": [ /* opcional, solo en VALIDATION_ERROR */ ]
  }
}
```

---

## Módulo: `auth`

Autenticación por sesión vía cookie `httpOnly` (no JWT). El estado de sesión vive en Postgres (tabla `sessions`), identificado por un token aleatorio en la cookie — nunca información auto-contenida.

### Entidades

- **User** (`users`): `id`, `email`, `passwordHash`, `displayName`, `avatarUrl`, `isActive`, `createdAt`, `updatedAt`
- **Session** (`sessions`): `id` (token), `userId`, `expiresAt`, `createdAt`

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | No | Crea usuario + sesión. Rate limited. |
| POST | `/auth/login` | No | Verifica credenciales, crea sesión. Rate limited. Protegido contra timing attacks (siempre hashea, incluso si el usuario no existe). |
| GET | `/auth/me` | Sí | Devuelve el usuario de la sesión activa. |
| POST | `/auth/logout` | No | Borra la sesión actual, limpia cookie. |
| POST | `/auth/logout-all` | Sí | Borra todas las sesiones del usuario. |

### Middleware: `requireAuth`

Lee la cookie `session_id`, valida que la sesión exista y no haya expirado, carga el usuario y lo adjunta a `req.userId`. Si la sesión está por expirar en menos de 7 días, la renueva automáticamente (ventana deslizante de 30 días).

### Seguridad aplicada

- Rate limiting en login/registro (10 intentos / 15 min)
- Hash de contraseñas con Argon2id, timing-safe en login
- Límites de tamaño en inputs (password 8–128 chars, email/name máx 255)
- Helmet (headers de seguridad), CORS explícito con `credentials: true`
- `express.json({ limit: '10kb' })` para evitar payloads gigantes
- Shutdown limpio ante `SIGTERM`/`SIGINT`, captura de `uncaughtException`/`unhandledRejection`
- Pool de Postgres con límites (`max`, timeouts) para evitar agotar conexiones
- Variables de entorno validadas con Zod al arrancar
- Health check (`GET /health`) que verifica conexión real a la base de datos

**Pendiente (bloqueado por decisión de negocio externa):** verificación de email y recuperación de contraseña — requieren elegir un proveedor de envío de correos.

---

## Módulo: `tournaments`

Multi-tenancy: cada torneo es un tenant. Un usuario puede pertenecer a varios torneos con distintos roles.

### Particularidad de este módulo: idioma mixto intencional

El **código** (nombres de archivos, clases, propiedades TypeScript) está en **inglés**, siguiendo la misma convención que `auth`. La **base de datos** (nombres de tabla y columna) está en **español**, porque así fue definida originalmente y se decidió no migrarla. Drizzle permite este mapeo sin fricción:

```ts
export const tournaments = pgTable('torneos', {          // tabla física: torneos
  name: varchar('nombre', { length: 200 }).notNull(),     // columna física: nombre, propiedad TS: name
  // ...
});
```

Al agregar código a este módulo, seguir esta misma convención: TypeScript en inglés, columna física en español tal como está en el schema SQL original.

### Entidades actuales

- **Tournament** (`torneos`): `id`, `name`, `subtitle`, `description`, `slug`, `startDate`, `endDate`, `createdByUserId`, `createdAt`, `updatedByUserId`, `updatedAt`
- **TournamentMember** (`torneo_members`): `id`, `tournamentId`, `userId`, `roleId`, `status`, `createdAt`, `updatedAt` — la tabla que resuelve "quién puede administrar qué torneo"
- **Role** (`roles`): catálogo simple `id`, `name` (`OWNER`, `ADMIN`), `description` — sembrado con un script, los IDs se guardan en variables de entorno (`OWNER_ROLE_ID`, `ADMIN_ROLE_ID`)

### Reglas de negocio vigentes

- Al crear un torneo, el creador se convierte automáticamente en `OWNER` (fila en `torneo_members`)
- El `slug` se genera automáticamente desde el `name` (ej. "Copa Laguna 2026" → `copa-laguna-2026`)
- Un `slug` duplicado se **rechaza** con `409 SLUG_ALREADY_IN_USE` — no se agrega sufijo automático
- Solo el `OWNER` de un torneo puede editarlo
- Si se edita el `name`, el `slug` se regenera automáticamente (esto puede romper URLs públicas ya compartidas — el frontend debe advertirlo)

### Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/tournaments` | Sí | Crea torneo + membership OWNER automático |
| GET | `/tournaments` | Sí | Lista solo los torneos donde el usuario es member (nunca todos los torneos de la plataforma) |
| PATCH | `/tournaments/:id` | Sí (solo OWNER) | Edita torneo; regenera slug si cambia el name |

### Tablas definidas en el schema, aún sin endpoints (próximo trabajo)

- `categorias` — categorías del torneo (ej. por edad). `edades_min`/`edades_max` obligatorios.
- `equipos` — debe tener `categoria_id` obligatorio desde su creación. Nombre único por torneo.
- `jugadores` — número de camiseta único en **todo el torneo** (no por equipo). Se asigna a un equipo (vía `equipo_jugador`) en el mismo momento en que se crea — no puede quedar sin equipo.
- `equipo_jugador`, `partidos`, `eventos_partido`, `posiciones`, `goleadores`, `tarjetas`, `torneo_branding` — definidas en el schema SQL original, sin implementar todavía.

**Regla de autorización acordada para todo lo anterior:** solo el `OWNER` puede crear/editar (no `ADMIN`).

---

## Cómo agregar un nuevo modelo/módulo

Ejemplo hipotético: agregar `categorias`.

### 1. Si es una tabla del schema SQL ya definido

Verifica primero si la tabla ya existe en el schema SQL original (`torneos`, `categorias`, `equipos`, etc.) antes de inventar una nueva estructura. Si existe, la fuente de verdad de nombres de columna es ese SQL — no renombrar columnas físicas.

### 2. Domain

- `domain/entities/<entidad>.entity.ts` — interfaz TypeScript en inglés, un campo por columna
- `domain/repositories/<entidad>.repository.ts` — interfaz con los métodos que el caso de uso necesita (`findById`, `create`, etc.) — **no** exponer métodos "por si acaso"; agregar el método cuando exista un caso de uso real que lo necesite
- `domain/errors/<módulo>.errors.ts` — agregar errores nuevos si el modelo introduce reglas de negocio propias (ej. `CategoryNotFoundError`)

### 3. Application

- `application/use-cases/<acción>-<entidad>.use-case.ts` — una clase por acción (`CreateCategory`, `UpdateCategory`). Recibe repositorios/ports por constructor, nunca los instancia.
- Si necesita validar autorización (ej. "solo OWNER puede hacer esto"), reutilizar el patrón ya usado en `UpdateTournamentUseCase`: consultar `TournamentMemberRepository.findByTournamentAndUser` y comparar `roleId` contra `env.OWNER_ROLE_ID`.

### 4. Infrastructure

- Agregar la tabla a `infrastructure/database/schema.ts` del módulo correspondiente (mapeando nombre de tabla/columna física en español si así está en el SQL original, propiedad TS en inglés)
- Si el schema tiene más de un archivo entre módulos, **recordar actualizar `drizzle.config.ts`** para que `schema` sea un array incluyendo todos los archivos de schema relevantes — de lo contrario `drizzle-kit generate` no verá las tablas nuevas
- `infrastructure/database/drizzle-<entidad>.repository.ts` — implementa la interfaz del `domain`

### 5. Presentation

- `presentation/schemas/<entidad>.schemas.ts` — Zod schema del body esperado
- `presentation/utils/public-<entidad>.ts` — función que decide qué campos exponer al cliente (nunca exponer campos internos como `passwordHash` o equivalentes)
- Agregar método al controller existente del módulo, o crear uno nuevo si la entidad lo amerita
- Agregar la ruta en `<módulo>.routes.ts`, protegida con `requireAuth` (importado desde `auth.module.ts`) si aplica

### 6. Module

- Conectar todo en `<módulo>.module.ts`: instanciar repositorios, ports, use cases, controller; exportar el router

### 7. Migración

```bash
npm run db:generate   # genera el SQL de migración a partir del schema.ts actualizado
npm run db:migrate    # aplica la migración a Neon
```

Revisar la salida de `db:generate` — debe listar la tabla nueva. Si no aparece, revisar que `drizzle.config.ts` incluya el archivo de schema correcto.

### 8. Errores comunes de TypeScript a esperar

El proyecto usa `exactOptionalPropertyTypes: true`. Cuando un campo opcional viene de Zod (`.optional()`), su tipo real es `T | undefined`, no `T?`. Si una firma de función declara `campo?: string` sin `| undefined` explícito, TypeScript va a rechazar pasarle un valor `undefined`. Fix: declarar `campo?: string | undefined` en la firma.

Cuando Drizzle infiere un tipo de columna `date` (no `timestamp`), regresa `string`, no `Date` — asegúrate de que la entidad de `domain` refleje el tipo real que Drizzle devuelve, no el que "debería ser" conceptualmente.

---

## Scripts útiles

```bash
npm run dev            # servidor con watch (tsx)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run db:generate    # genera migración desde el schema
npm run db:migrate     # aplica migraciones pendientes
npm run seed:roles     # siembra roles OWNER/ADMIN (solo necesario una vez por entorno)
```
