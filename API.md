# tournament-api — API Reference

API **privada (admin)** para administrar torneos deportivos multi-tenant.

- Autenticación: cookie de sesión `httpOnly` (no JWT)
- Content-Type: `application/json`
- Cliente: enviar cookies (`credentials: 'include'`)

**Errores (siempre el mismo shape):**
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Texto legible",
    "details": []
  }
}
```

---

## auth

Todo el acceso al panel depende de una sesión en servidor. Sin esto no hay multi-usuario ni permisos por torneo.

### `POST /auth/register`
**Por qué:** da de alta administradores/staff en la plataforma. Crea usuario + sesión en un solo paso para no forzar un login extra tras registrarse.

**Body:** `email`, `password` (8–128), `displayName`, `avatarUrl?`  
**Auth:** no (rate limited)

---

### `POST /auth/login`
**Por qué:** recuperar sesión en otro dispositivo o tras logout. Protegido contra timing attacks y rate limited para limitar fuerza bruta.

**Body:** `email`, `password`  
**Auth:** no (rate limited)

---

### `GET /auth/me`
**Por qué:** el frontend necesita saber quién está logueado al arrancar (splash → home) sin guardar datos sensibles en localStorage.

**Auth:** sí

---

### `POST /auth/logout`
**Por qué:** cerrar solo esta sesión (este navegador/dispositivo) sin tumbar otras pestañas o móviles del mismo usuario.

**Auth:** no (usa la cookie si existe)

---

### `POST /auth/logout-all`
**Por qué:** “cerrar sesión en todos lados” si hubo robo de cookie o cambio de contraseña futuro.

**Auth:** sí

---

## health

### `GET /health`
**Por qué:** que load balancers, monitores y deploys sepan si la app **y** Postgres responden. No es un “ping vacío”: ejecuta `SELECT 1`.

**Auth:** no

---

## tournaments

Cada torneo es un tenant. Un usuario solo ve y administra los torneos donde es member.

### `POST /tournaments`
**Por qué:** punto de entrada del producto: crear un torneo nuevo. El creador queda automáticamente como **OWNER** (membership), para no dejar torneos huérfanos sin admin.

**Body:** `name`, `subtitle?`, `description?`, `startDate?`, `endDate?`, `timezone?`  
- `slug` se genera del nombre; si choca → `409` (no se inventa sufijo automático)  
**Auth:** sí

---

### `GET /tournaments`
**Por qué:** home del admin: “mis torneos”. Nunca lista todos los torneos de la plataforma (aislamiento multi-tenant).

**Auth:** sí

---

### `PATCH /tournaments/:id`
**Por qué:** corregir nombre, fechas, descripción. Solo **OWNER**. Si cambia `name`, se regenera `slug` (el frontend debe avisar que URLs públicas pueden romperse).

**Auth:** sí (OWNER)

---

### `DELETE /tournaments/:id`
**Por qué:** archivar/eliminar un torneo que no se usará. Cascadas en DB limpian datos hijos según el schema.

**Auth:** sí (según reglas del use case / OWNER)

---

## categories

Un torneo casi siempre se divide por edad o nivel (Sub-12, Sub-15, Libre…). Sin categorías no hay forma limpia de agrupar equipos, partidos y tablas.

### `GET /tournaments/:tournamentId/categories`
**Por qué:** armar el selector de categoría al crear equipos, jugadores o partidos, y listar la estructura del torneo.

**Auth:** sí

---

### `POST /tournaments/:tournamentId/categories`
**Por qué:** definir esas divisiones al configurar el torneo. `minAge` / `maxAge` opcionales pero, si ambos vienen, `maxAge >= minAge`.

**Body:** `title`, `minAge?`, `maxAge?`, `description?`, `order?`  
**Auth:** sí (OWNER/ADMIN según use case)

---

### `PATCH /categories/:id`
**Por qué:** renombrar, reordenar o ajustar rangos de edad sin recrear la categoría (y sin perder equipos/partidos ligados).

**Auth:** sí

---

### `DELETE /categories/:id`
**Por qué:** quitar una categoría que se creó por error o ya no aplica (ojo con datos dependientes).

**Auth:** sí

---

## teams

Los participantes del torneo. Todo partido y casi toda estadística pivota sobre equipos.

### `GET /tournaments/:tournamentId/teams`
**Por qué:** listar planteles del torneo para UI de fixtures, alineaciones y tablas.

**Auth:** sí

---

### `POST /tournaments/:tournamentId/teams`
**Por qué:** inscribir un equipo. `categoryId` es obligatorio desde el alta: un equipo siempre pertenece a una categoría (no “flota” a nivel torneo).

**Body:** `categoryId`, `name`, `abbreviation?`, `logoUrl?`  
- Nombre único por torneo  
**Auth:** sí

---

### `PATCH /teams/:id`
**Por qué:** corregir nombre, siglas, logo o mover de categoría si el reglamento lo permite.

**Auth:** sí

---

### `DELETE /teams/:id`
**Por qué:** dar de baja un equipo que no participa.

**Auth:** sí

---

## players

Jugadores del torneo, siempre ligados a categoría y a un equipo al crearse.

### `GET /tournaments/:tournamentId/players`
**Por qué:** plantillas, dorsales, capitanes; base para eventos (quién marcó / quién vio tarjeta).

**Auth:** sí

---

### `POST /tournaments/:tournamentId/players`
**Por qué:** alta de jugador **y** asignación a equipo en el mismo paso (no se permiten jugadores “sueltos”). El número de camiseta es único en **todo el torneo**, no por equipo — evita confusiones en actas y rankings.

**Body:** `categoryId`, `teamId`, `firstName`, `lastName`, `number`, `birthDate?`, `isCaptain?`, `role?`  
**Auth:** sí

---

### `PATCH /players/:id`
**Por qué:** cambio de dorsal, traspaso de equipo, datos personales, capitán.

**Auth:** sí

---

### `DELETE /players/:id`
**Por qué:** baja de un jugador que no sigue en el torneo.

**Auth:** sí

---

## matches

Calendario / fixtures. Sin partidos no hay resultados ni estadísticas.

### `GET /tournaments/:tournamentId/matches`
**Por qué:** ver el calendario del torneo. Filtros opcionales por categoría o estado para pantallas de “próximos” / “jugados”.

**Query:** `categoryId?`, `status?` (`scheduled` | `in_progress` | `finished` | `cancelled` | `postponed`)  
**Auth:** sí

---

### `POST /tournaments/:tournamentId/matches`
**Por qué:** programar un enfrentamiento local vs visitante en una categoría, con fecha/hora y sede.

**Body:** `categoryId`, `homeTeamId`, `awayTeamId`, `scheduledAt` (ISO 8601), `venue?`, `status?`  
- Equipos distintos y de la misma categoría/torneo  
**Auth:** sí

---

### `PATCH /matches/:id`
**Por qué:** reprogramar, cambiar sede, corregir equipos **o** avanzar el estado del partido.  
Cuando `status` pasa a `finished` (o deja de serlo), se **recalculan** posiciones, goleadores y tarjetas de esa categoría.

**Auth:** sí

---

### `DELETE /matches/:id`
**Por qué:** quitar un fixture erróneo o cancelado de forma definitiva.

**Auth:** sí

---

## match-events

Detalle de lo que pasó en el partido (goles, tarjetas, etc.). Es la **fuente de verdad** de marcadores y rankings; las tablas `posiciones` / `goleadores` / `tarjetas` son materializaciones.

### `GET /matches/:matchId/events`
**Por qué:** mostrar la crónica del partido (minuto a minuto) en el admin o en una ficha de resultado.

**Auth:** sí

---

### `POST /matches/:matchId/events`
**Por qué:** registrar un gol, asistencia, tarjeta, cambio u otro evento mientras el partido se juega o al cargar el acta. Dispara recálculo de stats si el partido ya está `finished`.

**Body:**
```json
{
  "eventType": "gol",
  "minute": 23,
  "teamId": "uuid",
  "playerId": "uuid",
  "assistedByPlayerId": "uuid",
  "description": "opcional"
}
```
- `eventType`: `gol` | `asistencia` | `tarjeta_amarilla` | `tarjeta_roja` | `cambio` | `otro`  
- `teamId` debe ser local o visitante  
- jugador/asistidor deben ser de ese equipo  
- asistidor solo tiene sentido con `gol`  

**Auth:** sí (OWNER/ADMIN)

---

### `DELETE /match-events/:id`
**Por qué:** corregir un evento mal cargado (gol anulado, tarjeta equivocada). También recalcula stats del partido asociado.

**Auth:** sí (OWNER/ADMIN)

---

## standings

Lectura de las tablas ya materializadas. No se “editan” a mano: se recalculan desde partidos `finished` + eventos.

Base path:
`/tournaments/:tournamentId/categories/:categoryId`

### `GET .../standings`
**Por qué:** tabla de posiciones (PJ, PG, PE, PP, GF, GC, DG, puntos). Es lo que el admin y, más adelante, la API pública mostrarán como “la tabla”.

**Auth:** no (router actual sin `requireAuth`)

---

### `GET .../top-scorers`
**Por qué:** ranking de goleadores y asistencias por categoría, derivado de eventos `gol` (+ `assistedByPlayerId`).

**Auth:** no

---

### `GET .../cards`
**Por qué:** ranking de tarjetas amarillas/rojas por categoría, para disciplina y reportes.

**Auth:** no

---

## Flujo recomendado

1. Register / Login  
2. Crear torneo  
3. Crear categorías  
4. Crear equipos (con categoría)  
5. Crear jugadores (con equipo)  
6. Crear partidos  
7. Cargar eventos (goles, tarjetas…)  
8. Marcar partido `finished` → se actualizan standings  
9. Consultar `standings` / `top-scorers` / `cards`

---

## Aún no expuesto por API

- **Branding** (`torneo_branding`: logo/banner del torneo)  
- **API pública** solo lectura (proyecto aparte)  
- Verificación de email / recuperación de contraseña  
