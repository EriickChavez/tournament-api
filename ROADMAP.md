# tournament-api — Roadmap

Qué existe hoy, qué sigue, y qué se decidió posponer deliberadamente. Última actualización: reflejando el estado de la conversación de planeación del proyecto.

---

## ✅ Completado

### Backend — módulo `auth`

- [x] Registro de usuario (`POST /auth/register`)
- [x] Login (`POST /auth/login`)
- [x] Sesión actual (`GET /auth/me`)
- [x] Logout (`POST /auth/logout`)
- [x] Logout de todas las sesiones (`POST /auth/logout-all`)
- [x] Middleware `requireAuth` con rotación automática de sesión
- [x] Rate limiting en login/registro
- [x] Protección contra timing attacks en login
- [x] Límites de tamaño en inputs y body
- [x] Headers de seguridad (Helmet) y CORS explícito
- [x] Shutdown limpio, manejo de errores no capturados
- [x] Pool de Postgres con límites y timeouts
- [x] Variables de entorno validadas al arrancar
- [x] Health check real (verifica conexión a base de datos)
- [x] Logging estructurado
- [x] Tabla `users` migrada a su forma definitiva (`displayName`, `avatarUrl`, `isActive`)

### Backend — módulo `tournaments`

- [x] Schema completo de base de datos definido y migrado (torneos, categorías, equipos, jugadores, partidos, eventos, posiciones, goleadores, tarjetas, users, roles, membership, branding)
- [x] Crear torneo (`POST /tournaments`) — con membership OWNER automático y slug autogenerado
- [x] Listar mis torneos (`GET /tournaments`) — filtrado por membership del usuario
- [x] Editar torneo (`PATCH /tournaments/:id`) — solo OWNER, regenera slug si cambia el nombre
- [x] Obtener torneo por ID, con checks de autorización
- [x] Roles `OWNER`/`ADMIN` sembrados en base de datos
- [x] **Membership**: invitar, listar (paginado), cambiar rol, remover miembro; lookup de usuario por email
- [x] **Categorías, equipos, jugadores**: CRUD completo con las reglas de negocio acordadas
- [x] **Partidos y eventos de partido**: fixtures, registro de eventos (goles, tarjetas, asistencias, cambios)
- [x] **Tabla de posiciones**: recálculo automático integrado al ciclo de vida de partidos/eventos
- [x] Paginación compartida integrada en equipos, jugadores y partidos

### Backend — API pública

- [x] Búsqueda paginada de torneos (sin login)
- [x] Torneo, categorías y partidos por ID/slug (resolución dinámica), con rate limiting dedicado

### Backend — módulo `superadmins`

- [x] Autenticación y sesión de superadmin separada
- [x] Gestión de usuarios: crear, listar, cascade delete
- [x] Constraint de email único

### Frontend

- [x] Especificación completa (prompt) del flujo de autenticación: Splash → Login → Home
- [x] Especificación completa (prompt) de crear/listar/editar torneo
- [x] Proyecto admin (React + Vite) iniciado — ver `tournament-admin`

---

## 🔜 Sigue (definido, no bloqueado, listo para construir)

### Backend

- [ ] **Branding de torneo** — diseño aterrizado, ver spec completa abajo. Falta decidir proveedor de storage antes de implementar la parte de subida.
- [ ] Definir y completar el módulo `settings` — hoy es solo el scaffold de carpetas (domain/application/infrastructure/presentation), sin ningún archivo. Aclarar su alcance antes de escribir código.
- [ ] Cobertura de tests — actualmente 0 archivos `*.test.ts` en todo el repo pese a 8+ módulos y 50+ rutas.

### Frontend

- [ ] Construir la UI real de Splash/Login/Home (hoy solo existe la especificación)
- [ ] Construir la UI real de listar/crear/editar torneo (hoy solo existe la especificación)

---

## 🧭 Roadmap más amplio (mencionado, sin especificar aún)

Estas piezas se identificaron como necesarias en algún momento, pero **no tienen diseño de detalle todavía** — falta pasar por el mismo proceso de decisiones (reglas de negocio, autorización, campos) antes de construirlas.

- **Goleadores y tarjetas** (`goleadores`, `tarjetas`) — materializaciones similares a posiciones
- **Membership avanzado** — hoy solo existe `OWNER`/`ADMIN`; en algún momento se habló de roles adicionales (`EDITOR`, `REFEREE`, `SCORER`, `VIEWER`) y permisos granulares, pero se decidió no construirlo hasta que haga falta

---

## ⏸️ Pospuesto deliberadamente (con razón explícita)

- **Verificación de email y recuperación de contraseña** — el schema de `users` no tiene campo para email verificado; bloqueado hasta que se elija un proveedor de envío de correos (Resend, SendGrid, etc.) junto con el equipo
- **Migración a Redis** (sesiones + rate limiting distribuido) — decidido posponer; hoy funciona con Postgres/memoria porque solo hay una instancia del servidor corriendo. Es la primera pieza de infraestructura a resolver cuando se despliegue a producción con más de una instancia.
- **`accent_color` en `torneo_branding`** — se consideró agregarlo para soportar personalización de color en el admin, pero se decidió mantener la base de datos exactamente como fue definida originalmente, sin esta columna
- **Registro de usuario en el frontend** — el endpoint existe en el backend, pero la pantalla de registro se dejó fuera del alcance del frontend por decisión explícita (no se aclaró aún el flujo de cómo se van a dar de alta nuevos administradores)
- **Roles/permisos granulares en `torneo_members`** — hoy es simple (`OWNER`/`ADMIN` como catálogo fijo), decidido a propósito para no atar la arquitectura a una idea todavía en evolución
- **Unificación de idioma en todo el proyecto** — se consideró estandarizar todo a un solo idioma (inglés o español) pero se decidió mantener cada módulo con su propia convención (auth en inglés; tournaments con código en inglés pero base de datos en español)

---

## 📐 Spec: Branding de torneo

Diseño aterrizado el 2026-09-06. Reemplaza la entrada anterior de "sin diseño todavía".

**Decisiones tomadas:**

- El backend recibe el archivo (multipart) y lo sube él mismo — no se generan presigned URLs ni se le da al frontend acceso directo a credenciales de storage. Motivo: si el frontend sube directo a S3, necesitaría credenciales o URLs firmadas expuestas, lo cual reduce el control sobre validación (tipo/tamaño) y aumenta superficie de ataque.
- Proveedor de storage: **sin decidir todavía**. Para no bloquear el desarrollo, se define un puerto (`BrandingStoragePort`) en `domain/`, con un adapter concreto intercambiable en `infrastructure/` — mismo patrón hexagonal que ya usa el resto del proyecto (repositorios). Así se puede arrancar con un adapter simple (ej. disco local o un bucket de prueba) y cambiarlo sin tocar use-cases ni rutas.
- Lectura: **pública** — se expone junto con (o al lado de) el endpoint público de torneo por slug/ID, sin requerir sesión.
- Escritura: **privada**, solo `OWNER` del torneo — mismo patrón de autorización que `PATCH /tournaments/:id`.

**Endpoints propuestos:**

- `PATCH /tournaments/:id/branding` (privado, OWNER) — `multipart/form-data` con campos opcionales `logo` y `banner` (se puede actualizar uno sin tocar el otro). Valida tipo MIME (`image/png`, `image/jpeg`, `image/webp`) y tamaño máximo (sugerido: 2MB logo, 5MB banner — a confirmar). Hace upsert sobre `torneo_branding` (ya tiene constraint único por `torneo_id`, así que es un solo registro por torneo).
- `GET /tournaments/:id/branding` o campo embebido en la respuesta pública del torneo (a decidir cuál se prefiere) — devuelve `logoUrl`/`bannerUrl`, `null` si no se ha configurado.

**Pendiente antes de implementar:**

- Elegir proveedor de storage (S3, S3-compatible, Cloudinary, u otro) para escribir el adapter concreto y sus env vars.
- Confirmar límites de tamaño de archivo.
- Decidir si el endpoint público devuelve el branding embebido en `GET /public/tournaments/:slug` o como endpoint separado.
- Decidir si se borra la imagen anterior del storage al reemplazarla (evitar huérfanos) o se deja para después.

---

## Decisiones de diseño que vale la pena recordar (para no revisitarlas sin necesidad)

- Dos APIs separadas (admin / pública) desde el diseño original — no una sola API con rutas compartidas
- Slug duplicado se **rechaza**, no se resuelve con sufijo automático
- El **OWNER_ROLE_ID**/**ADMIN_ROLE_ID** viven en variables de entorno (no se resuelven buscando por nombre en cada request) — decisión final tras discutir alternativas
- La tabla `users` del módulo `tournaments` es la única y definitiva — no hay una segunda tabla de usuarios en `auth`
- El número de camiseta de un jugador es único en **todo el torneo**, no por equipo — confirmado explícitamente
