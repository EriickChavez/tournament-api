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
- [x] Roles `OWNER`/`ADMIN` sembrados en base de datos

### Frontend
- [x] Especificación completa (prompt) del flujo de autenticación: Splash → Login → Home
- [x] Especificación completa (prompt) de crear/listar/editar torneo

---

## 🔜 Sigue (definido, no bloqueado, listo para construir)

### Backend — módulo `tournaments`
- [ ] **Categorías** — crear/editar/listar. Reglas ya acordadas: `edades_min`/`edades_max` obligatorios, orden manejable.
- [ ] **Equipos** — crear/editar/listar. Reglas ya acordadas: `categoria_id` obligatorio desde la creación, nombre único por torneo.
- [ ] **Jugadores** — crear/editar/listar. Reglas ya acordadas: número de camiseta único en todo el torneo (no por equipo), se asigna a un equipo (vía `equipo_jugador`) en el mismo momento en que se crea.
- [ ] Autorización consistente: solo `OWNER` puede crear/editar en los tres modelos anteriores (mismo patrón que `PATCH /tournaments/:id`)

### Frontend
- [ ] Construir la UI real de Splash/Login/Home (hoy solo existe la especificación)
- [ ] Construir la UI real de listar/crear/editar torneo (hoy solo existe la especificación)

---

## 🧭 Roadmap más amplio (mencionado, sin especificar aún)

Estas piezas se identificaron como necesarias en algún momento, pero **no tienen diseño de detalle todavía** — falta pasar por el mismo proceso de decisiones (reglas de negocio, autorización, campos) antes de construirlas.

- **Calendario / partidos** (`partidos`) — fixtures, local vs visitante
- **Eventos de partido** (`eventos_partido`) — goles, tarjetas, asistencias, cambios
- **Tabla de posiciones** (`posiciones`) — se calcula/materializa a partir de `eventos_partido`, no es la fuente de verdad
- **Goleadores y tarjetas** (`goleadores`, `tarjetas`) — materializaciones similares a posiciones
- **Branding de torneo** (`torneo_branding`) — logo, banner; la tabla ya existe en el schema pero sin endpoints. Ver sección de personalización más abajo.
- **API pública** (sin login, solo lectura) — proyecto/API separada por completo de la privada; mencionada desde el inicio de la planeación pero sin ningún trabajo iniciado
- **Membership avanzado** — hoy solo existe `OWNER`; en algún momento se habló de roles adicionales (`EDITOR`, `REFEREE`, `SCORER`, `VIEWER`) y permisos granulares, pero se decidió no construirlo hasta que haga falta

---

## ⏸️ Pospuesto deliberadamente (con razón explícita)

- **Verificación de email y recuperación de contraseña** — el schema de `users` no tiene campo para email verificado; bloqueado hasta que se elija un proveedor de envío de correos (Resend, SendGrid, etc.) junto con el equipo
- **Migración a Redis** (sesiones + rate limiting distribuido) — decidido posponer; hoy funciona con Postgres/memoria porque solo hay una instancia del servidor corriendo. Es la primera pieza de infraestructura a resolver cuando se despliegue a producción con más de una instancia.
- **`accent_color` en `torneo_branding`** — se consideró agregarlo para soportar personalización de color en el admin, pero se decidió mantener la base de datos exactamente como fue definida originalmente, sin esta columna
- **Registro de usuario en el frontend** — el endpoint existe en el backend, pero la pantalla de registro se dejó fuera del alcance del frontend por decisión explícita (no se aclaró aún el flujo de cómo se van a dar de alta nuevos administradores)
- **Roles/permisos granulares en `torneo_members`** — hoy es simple (`OWNER`/`ADMIN` como catálogo fijo), decidido a propósito para no atar la arquitectura a una idea todavía en evolución
- **Unificación de idioma en todo el proyecto** — se consideró estandarizar todo a un solo idioma (inglés o español) pero se decidió mantener cada módulo con su propia convención (auth en inglés; tournaments con código en inglés pero base de datos en español)

---

## Decisiones de diseño que vale la pena recordar (para no revisitarlas sin necesidad)

- Dos APIs separadas (admin / pública) desde el diseño original — no una sola API con rutas compartidas
- Slug duplicado se **rechaza**, no se resuelve con sufijo automático
- El **OWNER_ROLE_ID**/**ADMIN_ROLE_ID** viven en variables de entorno (no se resuelven buscando por nombre en cada request) — decisión final tras discutir alternativas
- La tabla `users` del módulo `tournaments` es la única y definitiva — no hay una segunda tabla de usuarios en `auth`
- El número de camiseta de un jugador es único en **todo el torneo**, no por equipo — confirmado explícitamente
