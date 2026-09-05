# TOURNAMENT API

API **admin + pública** en el mismo servidor.

- Auth: cookie `httpOnly` `session_id` (no JWT)
- Content-Type: `application/json`
- Cliente con sesión: `credentials: 'include'`
- Paginación (donde aplica): query `page` (default `1`), `limit` (default `20`, max `100`)

**Error (shape fijo):**

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Texto legible",
    "details": []
  }
}
```

**Seguridad:**

- **Público** = sin login (rate limit de lectura)
- **Privado** = `requireAuth` (cookie de sesión válida)

---

## Auth

| Servicio    | Método y ruta           | Params / Query / Body                                              | Seguridad                 | Respuesta (éxito)                                 |
| ----------- | ----------------------- | ------------------------------------------------------------------ | ------------------------- | ------------------------------------------------- |
| Register    | `POST /auth/register`   | **Body:** `email`, `password` (8–128), `displayName`, `avatarUrl?` | Público (rate limit auth) | `201` — usuario + sesión (set-cookie)             |
| Login       | `POST /auth/login`      | **Body:** `email`, `password`                                      | Público (rate limit auth) | `200` — usuario + sesión (set-cookie)             |
| Logout      | `POST /auth/logout`     | — (usa cookie si existe)                                           | Público                   | `200` — limpia cookie / sesión                    |
| Logout all  | `POST /auth/logout-all` | —                                                                  | Privado                   | `200` — cierra todas las sesiones del usuario     |
| Me          | `GET /auth/me`          | —                                                                  | Privado                   | `200` — usuario de la sesión actual               |
| Lookup user | `GET /users/lookup`     | **Query:** `email`                                                 | Privado                   | `200` — datos públicos del usuario (para invitar) |

---

## Health

| Servicio | Método y ruta | Params / Query / Body | Seguridad | Respuesta (éxito)                |
| -------- | ------------- | --------------------- | --------- | -------------------------------- |
| Health   | `GET /health` | —                     | Público   | `200` — app + DB OK (`SELECT 1`) |

---

## Tournaments

| Servicio     | Método y ruta             | Params / Query / Body                                                                | Seguridad                                           | Respuesta (éxito)                                                          |
| ------------ | ------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| List public  | `GET /tournaments/public` | **Query:** `page?`, `limit?`, `search?`                                              | Público                                             | `200` `{ tournaments, pagination }`                                        |
| List mine    | `GET /tournaments`        | —                                                                                    | Privado                                             | `200` `{ tournaments }` (con `roleId`)                                     |
| Get by param | `GET /tournaments/:id`    | **Params:** `id` = **UUID** o **slug**                                               | UUID → **Privado** (membership). Slug → **Público** | UUID: `200` `{ tournament }` + role. Slug: `200` `{ tournament }` sin role |
| Create       | `POST /tournaments`       | **Body:** `name`, `subtitle?`, `description?`, `startDate?`, `endDate?`, `timezone?` | Privado                                             | `201` `{ tournament }` — creador = OWNER, slug auto                        |
| Update       | `PATCH /tournaments/:id`  | **Params:** `id` (UUID). **Body:** campos opcionales del torneo                      | Privado (OWNER)                                     | `200` `{ tournament }` — si cambia `name`, regenera slug                   |
| Delete       | `DELETE /tournaments/:id` | **Params:** `id` (UUID)                                                              | Privado (OWNER)                                     | `200` `{ message }`                                                        |

**Notas:**

- Slug duplicado → `409 SLUG_ALREADY_IN_USE` (no se añade sufijo).
- `GET /tournaments/public` está registrado **antes** de `/:id` (el slug `public` no se usa como detalle).

---

## Members

| Servicio     | Método y ruta                                         | Params / Query / Body                                    | Seguridad                   | Respuesta (éxito)               |
| ------------ | ----------------------------------------------------- | -------------------------------------------------------- | --------------------------- | ------------------------------- |
| List members | `GET /tournaments/:tournamentId/members`              | **Params:** `tournamentId`. **Query:** `page?`, `limit?` | Privado (member del torneo) | `200` `{ members, pagination }` |
| Invite       | `POST /tournaments/:tournamentId/members`             | **Body:** `userId` (uuid)                                | Privado                     | `201` `{ member }`              |
| Update role  | `PATCH /tournaments/:tournamentId/members/:memberId`  | **Params:** `tournamentId`, `memberId`                   | Privado                     | `200` `{ member }`              |
| Remove       | `DELETE /tournaments/:tournamentId/members/:memberId` | **Params:** `tournamentId`, `memberId`                   | Privado                     | `200` `{ message }`             |

**Ejemplo de respuesta (list members):**

```json
{
  "members": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "userId": "uuid",
      "roleId": "uuid",
      "status": "active",
      "displayName": "Juan",
      "avatarUrl": null,
      "roleName": "OWNER"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

## Categories

| Servicio           | Método y ruta                                | Params / Query / Body                                             | Seguridad   | Respuesta (éxito)                       |
| ------------------ | -------------------------------------------- | ----------------------------------------------------------------- | ----------- | --------------------------------------- |
| List by tournament | `GET /tournaments/:tournamentId/categories`  | **Params:** `tournamentId`                                        | **Público** | `200` `{ categories }` (sin paginación) |
| Create             | `POST /tournaments/:tournamentId/categories` | **Body:** `title`, `minAge?`, `maxAge?`, `description?`, `order?` | Privado     | `201` `{ category }`                    |
| Update             | `PATCH /categories/:id`                      | **Params:** `id`. **Body:** campos opcionales                     | Privado     | `200` `{ category }`                    |
| Delete             | `DELETE /categories/:id`                     | **Params:** `id`                                                  | Privado     | `200` `{ message }`                     |

---

## Teams

| Servicio           | Método y ruta                           | Params / Query / Body                                                          | Seguridad   | Respuesta (éxito)             |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ----------------------------- |
| List by tournament | `GET /tournaments/:tournamentId/teams`  | **Params:** `tournamentId`. **Query:** `page?`, `limit?`, `categoryId?` (uuid) | **Público** | `200` `{ teams, pagination }` |
| Create             | `POST /tournaments/:tournamentId/teams` | **Body:** `categoryId`, `name`, `abbreviation?`, `logoUrl?`                    | Privado     | `201` `{ team }`              |
| Update             | `PATCH /teams/:id`                      | **Params:** `id`. **Body:** campos opcionales                                  | Privado     | `200` `{ team }`              |
| Delete             | `DELETE /teams/:id`                     | **Params:** `id`                                                               | Privado     | `200` `{ message }`           |

**Ejemplos:**

```http
GET /tournaments/:tournamentId/teams
GET /tournaments/:tournamentId/teams?page=1&limit=20
GET /tournaments/:tournamentId/teams?categoryId=<uuid>
GET /tournaments/:tournamentId/teams?categoryId=<uuid>&page=1&limit=20
```

**Reglas:**

- `categoryId` obligatorio al crear.
- Nombre único por torneo.
- Sin `categoryId` en el listado → todos los equipos del torneo.
- Con `categoryId` → solo equipos de esa categoría.
- `categoryId` inválido (no uuid) → `400 VALIDATION_ERROR`.

---

## Players

| Servicio           | Método y ruta                             | Params / Query / Body                                                                                    | Seguridad   | Respuesta (éxito)               |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------- |
| List by tournament | `GET /tournaments/:tournamentId/players`  | **Params:** `tournamentId`. **Query:** `page?`, `limit?`                                                 | **Privado** | `200` `{ players, pagination }` |
| List by team       | `GET /teams/:teamId/players`              | **Params:** `teamId`. **Query:** `page?`, `limit?`                                                       | **Público** | `200` `{ players, pagination }` |
| Create             | `POST /tournaments/:tournamentId/players` | **Body:** `categoryId`, `teamId`, `firstName`, `lastName`, `number`, `birthDate?`, `isCaptain?`, `role?` | Privado     | `201` `{ player }`              |
| Update             | `PATCH /players/:id`                      | **Params:** `id`. **Body:** campos opcionales                                                            | Privado     | `200` `{ player }`              |
| Delete             | `DELETE /players/:id`                     | **Params:** `id`                                                                                         | Privado     | `200` `{ message }`             |

**Reglas:**

- Al crear se asigna a un equipo (no hay jugadores sueltos).
- Número de camiseta único en **todo el torneo** (no solo por equipo).
- No hay listado público general de jugadores del torneo; solo por equipo.

---

## Matches

| Servicio            | Método y ruta                                   | Params / Query / Body                                                                             | Seguridad   | Respuesta (éxito)                                         |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------- |
| List by tournament  | `GET /tournaments/:tournamentId/matches`        | **Params:** `tournamentId`. **Query:** `page?`, `limit?`, `categoryId?`, `status?`                | **Público** | `200` `{ matches, pagination }`                           |
| List public (alias) | `GET /tournaments/:tournamentId/matches/public` | Igual que arriba                                                                                  | **Público** | Igual (misma lógica)                                      |
| Get by id           | `GET /matches/:id`                              | **Params:** `id`                                                                                  | **Público** | `200` `{ match }` (con equipos y categoría)               |
| Create              | `POST /tournaments/:tournamentId/matches`       | **Body:** `categoryId`, `homeTeamId`, `awayTeamId`, `scheduledAt` (ISO 8601), `venue?`, `status?` | Privado     | `201` `{ match }`                                         |
| Update              | `PATCH /matches/:id`                            | **Params:** `id`. **Body:** campos opcionales + `status?`                                         | Privado     | `200` `{ match }` — si pasa a `finished`, recalcula stats |
| Delete              | `DELETE /matches/:id`                           | **Params:** `id`                                                                                  | Privado     | `200` `{ message }`                                       |

**`status`:** `scheduled` | `in_progress` | `finished` | `cancelled` | `postponed`

---

## Match events

| Servicio      | Método y ruta                   | Params / Query / Body | Seguridad   | Respuesta (éxito)                   |
| ------------- | ------------------------------- | --------------------- | ----------- | ----------------------------------- |
| List by match | `GET /matches/:matchId/events`  | **Params:** `matchId` | **Público** | `200` `{ events }` (sin paginación) |
| Create        | `POST /matches/:matchId/events` | **Body:** ver abajo   | Privado     | `201` `{ event }`                   |
| Delete        | `DELETE /match-events/:id`      | **Params:** `id`      | Privado     | `200` `{ message }`                 |

**Body create event:**

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

**`eventType`:** `gol` | `asistencia` | `tarjeta_amarilla` | `tarjeta_roja` | `cambio` | `otro`

Al crear/borrar eventos de un partido `finished` se recalculan posiciones / goleadores / tarjetas.

---

## Standings (materializaciones)

Base: `/tournaments/:tournamentId/categories/:categoryId`

| Servicio    | Método y ruta         | Params / Query / Body                    | Seguridad   | Respuesta (éxito)                               |
| ----------- | --------------------- | ---------------------------------------- | ----------- | ----------------------------------------------- |
| Standings   | `GET .../standings`   | **Params:** `tournamentId`, `categoryId` | **Público** | `200` — tabla (PJ, PG, PE, PP, GF, GC, DG, pts) |
| Top scorers | `GET .../top-scorers` | igual                                    | **Público** | `200` — ranking goles / asistencias             |
| Cards       | `GET .../cards`       | igual                                    | **Público** | `200` — ranking tarjetas                        |

No se editan a mano: se recalculan desde partidos `finished` + eventos.

---

## Paginación

### Query params

| Query   | Tipo         | Default | Límites                  | Descripción                  |
| ------- | ------------ | ------- | ------------------------ | ---------------------------- |
| `page`  | number (int) | `1`     | mínimo `1`               | Número de página (1-indexed) |
| `limit` | number (int) | `20`    | mínimo `1`, máximo `100` | Ítems por página             |

Si omites los params → defaults.  
Valores inválidos (`page=0`, `limit=999`, `page=abc`) → `400 VALIDATION_ERROR`.

### Shape de respuesta

```json
{
  "teams": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

| Campo        | Significado                                            |
| ------------ | ------------------------------------------------------ |
| `page`       | Página actual                                          |
| `limit`      | Tamaño de página usado                                 |
| `total`      | Total de registros que cumplen el filtro (sin paginar) |
| `totalPages` | `ceil(total / limit)`; si `total === 0` → `0`          |

La clave de la colección cambia según el recurso: `tournaments`, `teams`, `players`, `matches`, `members`.
