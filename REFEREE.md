# API del árbitro (v1)

## 1. Generalidades

**URL base:** `https://<host>/v1`. Las imágenes (logos) están en la raíz, sin `/v1`.

**Encabezados**

| Encabezado      | Valor                   | Cuándo                                                    |
| --------------- | ----------------------- | --------------------------------------------------------- |
| `Accept`        | `application/json`      | siempre                                                   |
| `X-Client-Type` | `mobile`                | siempre (obligatorio en el login)                         |
| `Authorization` | `Bearer <sessionToken>` | todas menos el login                                      |
| `Content-Type`  | `application/json`      | peticiones con cuerpo. En los `POST` sin datos manda `{}` |

**Formatos:** fechas en ISO 8601 con zona (`2026-10-12T18:34:05-06:00`), ids en UUID.

**Errores:** siempre `{ "error": { "code": "...", "message": "...", "details": [...]? } }`. La app debe decidir por `code`, no por `message`.

**Límites de uso:** las lecturas públicas (`GET /matches/:id`, `GET /teams/:id/players`, `GET /matches/:id/events`) permiten 60 peticiones por minuto por IP. Con varios árbitros en la misma red de la cancha conviene guardar en caché las plantillas y no consultar en bucle. Superarlo da `429 TOO_MANY_REQUESTS`.

**Quién puede operar un partido:** el dueño del torneo siempre. Los demás miembros solo si están asignados al partido. Si el partido no tiene árbitros asignados, cualquier admin del torneo puede.

---

## 2. Sesión

### `POST /auth/login`

Body: `{ "email": "...", "password": "..." }`

`200`:

```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "displayName": "...",
    "avatarUrl": null,
    "isActive": true
  },
  "sessionToken": "64 caracteres hex",
  "expiresAt": "2026-11-11T18:00:00.000Z"
}
```

- La sesión dura 30 días y se renueva sola mientras se use (cuando le quedan menos de 7 días).
- Errores: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`, `403 ACCOUNT_SUSPENDED`, `429 TOO_MANY_REQUESTS` (15 intentos **fallidos** cada 15 minutos por IP; los exitosos no cuentan).

### `GET /auth/me`

`200 { "user": {...} }`. Útil al abrir la app para validar el token guardado.

### `POST /auth/logout`

`204` sin cuerpo. Borra la sesión en el servidor. Después elimina el token local.

---

## 3. Mis partidos

### `GET /matches/mine`

Partidos asignados al usuario, ordenados por fecha ascendente.

| Query          | Tipo                                                              | Notas                                          |
| -------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| `status`       | `scheduled`, `in_progress`, `finished`, `cancelled` o `postponed` | opcional                                       |
| `tournamentId` | uuid                                                              | opcional                                       |
| `from`, `to`   | ISO 8601 con zona                                                 | opcional, filtra por `scheduledAt` (inclusivo) |
| `page`         | entero ≥ 1                                                        | por defecto 1                                  |
| `limit`        | 1 a 100                                                           | por defecto 20                                 |

`200`:

```json
{
  "matches": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "categoryId": "uuid",
      "homeTeamId": "uuid",
      "awayTeamId": "uuid",
      "phaseId": null,
      "phaseGroupId": null,
      "round": 3,
      "homeScore": null,
      "awayScore": null,
      "homePenalties": null,
      "awayPenalties": null,
      "scheduledAt": "2026-10-12T18:00:00.000Z",
      "venue": "Cancha 1",
      "status": "scheduled",
      "homeTeam": {
        "id": "uuid",
        "name": "...",
        "abbreviation": "...",
        "logoUrl": "/branding/..."
      },
      "awayTeam": { "id": "uuid", "name": "...", "abbreviation": "...", "logoUrl": null },
      "category": { "id": "uuid", "title": "..." }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

Sin asignaciones devuelve `matches: []`. **Hoy no trae el nombre del torneo**, solo `tournamentId`.

### `GET /matches/:id`

Detalle de un partido (misma forma que cada elemento anterior): `{ "match": {...} }`. Es público.

### `GET /matches/:id/referees`

Ids de usuario asignados: `{ "refereeUserIds": ["uuid"] }`. Requiere ser miembro del torneo.

### `GET /teams/:teamId/players?page=&limit=`

Plantilla de un equipo (público, `limit` máx. 100):

```json
{
  "players": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "firstName": "...",
      "lastName": "...",
      "birthDate": "2000-01-31",
      "number": 10,
      "isCaptain": false,
      "role": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

## 4. Estado del partido

Los tres son `POST` con cuerpo `{}` y devuelven `200 { "match": {...} }`.

| Endpoint                   | Transición                                | Qué hace                                                                                                  |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `POST /matches/:id/start`  | `scheduled` o `postponed` → `in_progress` | Abre la cédula                                                                                            |
| `POST /matches/:id/finish` | `in_progress` → `finished`                | Cierra la cédula, fija el marcador según los eventos (0-0 si no hay goles) y actualiza posiciones y llave |
| `POST /matches/:id/reopen` | `finished` → `in_progress`                | Reabre para corregir; deshace posiciones y avance de llave                                                |

- Una transición inválida da `409 INVALID_MATCH_TRANSITION`. Si `start` falla así, probablemente el partido ya estaba iniciado: vuelve a consultarlo con `GET /matches/:id`.
- En partidos de eliminatoria, `finish` y `reopen` también pueden devolver un `409` si el cambio rompería el cruce de la llave.
- Con el campeonato cerrado: `409 CATEGORY_FINISHED`.

---

## 5. Eventos de la cédula

**Todo evento se registra, edita o borra solo con el partido `in_progress`.** En otro estado da `409 MATCH_NOT_IN_PROGRESS`.

### Objeto evento

```json
{
  "id": "uuid",
  "matchId": "uuid",
  "eventType": "gol",
  "minute": 34,
  "teamId": "uuid",
  "playerId": "uuid",
  "assistedByPlayerId": null,
  "substitutePlayerId": null,
  "description": null,
  "clientEventId": "uuid",
  "occurredAt": "2026-10-12T18:34:05.000Z",
  "derivedFromEventId": null
}
```

`derivedFromEventId` distinto de `null` significa que lo generó el sistema (roja por doble amarilla).

### Tipos de evento

| `eventType`        | Efecto en el marcador       | Notas                                                                |
| ------------------ | --------------------------- | -------------------------------------------------------------------- |
| `gol`              | +1 a `teamId`               | admite `assistedByPlayerId`                                          |
| `gol_penal`        | +1 a `teamId`               | cuenta para el goleador                                              |
| `autogol`          | +1 al **rival** de `teamId` | `teamId` es el equipo del jugador que lo comete                      |
| `tarjeta_amarilla` | ninguno                     | ver reglas de tarjetas                                               |
| `tarjeta_roja`     | ninguno                     | ver reglas de tarjetas                                               |
| `cambio`           | ninguno                     | `playerId` = sale, `substitutePlayerId` = entra (ambos obligatorios) |
| `asistencia`       | ninguno                     | **No cuenta en estadísticas.** Usa `assistedByPlayerId` en el gol    |
| `otro`             | ninguno                     | usa `description`                                                    |

No existe un tipo `falta`.

### `GET /matches/:matchId/events`

`200 { "events": [...] }`, ordenados por hora real (`occurredAt`, o la de creación si no viene). Público.

### `POST /matches/:matchId/events`

| Campo                | Obligatorio      | Regla                                                                   |
| -------------------- | ---------------- | ----------------------------------------------------------------------- |
| `eventType`          | sí               | uno de la tabla anterior                                                |
| `teamId`             | sí               | uno de los dos equipos del partido                                      |
| `playerId`           | no               | debe pertenecer a `teamId`                                              |
| `minute`             | no               | entero 0 a 200                                                          |
| `assistedByPlayerId` | no               | solo con `gol`; del mismo equipo                                        |
| `substitutePlayerId` | solo en `cambio` | del mismo equipo y distinto de `playerId`; en otros tipos no se permite |
| `description`        | no               | máx. 255 caracteres                                                     |
| `clientEventId`      | recomendado      | UUID generado en la app. Un reintento con el mismo id no duplica        |
| `occurredAt`         | recomendado      | momento real del evento; no puede ser más de 5 minutos futuro           |

```json
{
  "eventType": "gol",
  "teamId": "uuid",
  "playerId": "uuid",
  "minute": 34,
  "clientEventId": "uuid",
  "occurredAt": "2026-10-12T18:34:05-06:00"
}
```

- `201` si se creó, `200` si el `clientEventId` ya existía (devuelve el evento original). Cuerpo: `{ "event": {...}, "derivedEvents": [...] }`.
- Errores: `400 INVALID_TEAM_FOR_EVENT`, `400 INVALID_PLAYER_FOR_EVENT`, `400 INVALID_ASSIST_FOR_EVENT`, `400 INVALID_SUBSTITUTION`, `400 INVALID_OCCURRED_AT`, `409 PLAYER_ALREADY_SENT_OFF`, `409 MATCH_NOT_IN_PROGRESS`.

**Reglas de tarjetas (por jugador y partido):**

- La **segunda amarilla** se acepta y el sistema crea una roja ligada. Viene en `derivedEvents`, con `description: "Doble amarilla"`.
- Una roja directa se permite aunque el jugador tenga una amarilla previa.
- Un jugador ya expulsado (roja o dos amarillas) no admite más tarjetas: `409 PLAYER_ALREADY_SENT_OFF`.
- Si no se manda `playerId` en una tarjeta, no se aplican las reglas.

### `PATCH /match-events/:id`

Modifica un evento. Solo se pueden enviar estos campos (`null` los limpia):
`minute`, `playerId`, `assistedByPlayerId`, `substitutePlayerId`, `description`, `occurredAt`.

```json
{ "minute": 35, "playerId": "uuid" }
```

- `200 { "event": {...} }`.
- **No se pueden cambiar** `eventType`, `teamId` ni `clientEventId`: enviarlos da `400 VALIDATION_ERROR`. Para corregirlos, borra el evento y crea otro.
- En una **tarjeta** no se puede cambiar el jugador: `400 INVALID_EVENT_UPDATE`. Borra y vuelve a registrarla.
- Un evento **derivado** no se edita: `409 DERIVED_MATCH_EVENT`.
- En un `cambio`, ni `playerId` ni `substitutePlayerId` pueden quedar vacíos o iguales: `400 INVALID_SUBSTITUTION`.
- Otros errores: `404 MATCH_EVENT_NOT_FOUND`, `400 INVALID_PLAYER_FOR_EVENT`, `400 INVALID_ASSIST_FOR_EVENT`, `400 INVALID_OCCURRED_AT`, `409 MATCH_NOT_IN_PROGRESS`.

### `DELETE /match-events/:id`

`200 { "message": "Match event deleted successfully" }`.

- **Idempotente:** si el evento ya no existe, responde `200` igual. Es seguro reintentar.
- Si se borra una segunda amarilla, su roja derivada se borra con ella.
- Una roja derivada no se puede borrar sola: `409 DERIVED_MATCH_EVENT`.
- Borrar un gol o autogol actualiza el marcador en el momento.

---

## 6. Penales

`PATCH /matches/:id` con `{ "homePenalties": 4, "awayPenalties": 3 }` (enteros 0 a 99, siempre los dos; ambos `null` los borra).

- Solo aplica si el marcador está empatado y los penales no pueden quedar iguales: `400 INVALID_PENALTIES`.
- Se recomienda capturarlos **después** de `finish`.
- Responde `200 { "match": {...} }`.
- Este endpoint admite más campos (fecha, equipos, etc.), pero la app del árbitro solo debe enviar los penales. Hoy **no revisa si el árbitro está asignado** a ese partido.

---

## 7. Errores frecuentes y qué hacer

| `code`                                                   | HTTP | Acción en la app                                  |
| -------------------------------------------------------- | ---- | ------------------------------------------------- |
| `UNAUTHENTICATED`                                        | 401  | borrar el token y volver al login                 |
| `NOT_ASSIGNED_TO_MATCH`                                  | 403  | el partido no es suyo: refrescar "mis partidos"   |
| `NOT_TOURNAMENT_OWNER_OR_ADMIN`, `NOT_TOURNAMENT_MEMBER` | 403  | sin permisos en el torneo                         |
| `MATCH_NOT_FOUND`                                        | 404  | el partido ya no existe                           |
| `MATCH_NOT_IN_PROGRESS`                                  | 409  | la cédula está cerrada: detener el envío y avisar |
| `CATEGORY_FINISHED`                                      | 409  | el campeonato está cerrado: no se puede modificar |
| `VALIDATION_ERROR`                                       | 400  | datos mal formados; `details` lista los campos    |
| `TOO_MANY_REQUESTS`                                      | 429  | esperar y reintentar                              |
| `INTERNAL_SERVER_ERROR`                                  | 500  | reintentar con espera creciente                   |

---

## 8. Flujo recomendado de la app

1. Login, guardar el token en Keychain (iOS) o Keystore (Android) y llamar a `GET /matches/mine`.
2. Al abrir un partido: `GET /matches/:id` y las plantillas con `GET /teams/:teamId/players` (cacheadas).
3. Pulsar **Iniciar**: `POST /matches/:id/start`.
4. Durante el partido, cada acción crea un evento local con su `clientEventId` y `occurredAt` **en ese instante**, y lo mete a una cola persistente.
5. La cola envía en orden. Considera hecho cualquier `200` o `201`, reintenta con espera creciente en errores de red o 5xx, y descarta o pregunta al usuario ante un `400`. Un `409 MATCH_NOT_IN_PROGRESS` detiene la cola.
6. Para corregir un evento: `PATCH` (campos editables), o `DELETE` y crear de nuevo.
7. Pulsar **Finalizar**: `POST /matches/:id/finish`. Si hay empate en eliminatoria, después guardar penales con `PATCH /matches/:id`.
8. Si hubo un error: `POST /matches/:id/reopen`, corregir y volver a finalizar.

---

## 9. Limitaciones conocidas

- No hay tipo `falta`.
- `/matches/mine` no incluye el nombre del torneo.
- Los penales por `PATCH /matches/:id` no verifican la asignación.
- No hay alineación (titulares y suplentes) todavía.
- El árbitro es un admin del torneo: con la misma sesión podría editar o borrar partidos y equipos si llamara a esos endpoints. La app no debe exponerlos.
