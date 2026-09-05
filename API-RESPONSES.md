# Respuestas por servicio

**Error común (cualquier endpoint):**

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

## Auth

### `POST /auth/register` → `201`

Set-Cookie: `session_id=...; HttpOnly; ...`

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Juan Pérez",
    "avatarUrl": null,
    "isActive": true
  }
}
```

### `POST /auth/login` → `200`

Set-Cookie: `session_id=...`

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Juan Pérez",
    "avatarUrl": null,
    "isActive": true
  }
}
```

### `POST /auth/logout` → `204`

Sin body. Limpia cookie.

### `POST /auth/logout-all` → `204`

Sin body. Limpia cookie.

### `GET /auth/me` → `200`

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Juan Pérez",
    "avatarUrl": null,
    "isActive": true
  }
}
```

### `GET /users/lookup?email=...` → `200`

```json
{
  "user": {
    "id": "uuid",
    "displayName": "Juan Pérez",
    "avatarUrl": null
  }
}
```

_(No devuelve email ni password.)_

---

## Health

### `GET /health` → `200`

```json
{
  "status": "ok",
  "database": "up"
}
```

### `GET /health` → `503` (DB caída)

```json
{
  "status": "error",
  "database": "down"
}
```

---

## Tournaments

### `GET /tournaments/public` → `200`

```json
{
  "tournaments": [
    {
      "id": "uuid",
      "name": "Copa Laguna 2026",
      "subtitle": null,
      "description": null,
      "slug": "copa-laguna-2026",
      "startDate": "2026-06-01",
      "endDate": "2026-06-15",
      "timezone": "America/Mexico_City"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /tournaments` (mis torneos) → `200`

```json
{
  "tournaments": [
    {
      "id": "uuid",
      "name": "Copa Laguna 2026",
      "subtitle": null,
      "description": null,
      "slug": "copa-laguna-2026",
      "startDate": "2026-06-01",
      "endDate": "2026-06-15",
      "timezone": "America/Mexico_City",
      "roleId": "uuid"
    }
  ]
}
```

### `GET /tournaments/:slug` (público) → `200`

```json
{
  "tournament": {
    "id": "uuid",
    "name": "Copa Laguna 2026",
    "subtitle": null,
    "description": null,
    "slug": "copa-laguna-2026",
    "startDate": "2026-06-01",
    "endDate": "2026-06-15",
    "timezone": "America/Mexico_City"
  }
}
```

### `GET /tournaments/:uuid` (privado, member) → `200`

```json
{
  "tournament": {
    "id": "uuid",
    "name": "Copa Laguna 2026",
    "subtitle": null,
    "description": null,
    "slug": "copa-laguna-2026",
    "startDate": "2026-06-01",
    "endDate": "2026-06-15",
    "timezone": "America/Mexico_City",
    "roleId": "uuid"
  }
}
```

### `POST /tournaments` → `201`

```json
{
  "tournament": {
    "id": "uuid",
    "name": "Copa Laguna 2026",
    "subtitle": null,
    "description": null,
    "slug": "copa-laguna-2026",
    "startDate": null,
    "endDate": null,
    "timezone": "UTC"
  }
}
```

### `PATCH /tournaments/:id` → `200`

Mismo shape que create (`tournament` sin `roleId`).

### `DELETE /tournaments/:id` → `200`

```json
{
  "message": "Tournament deleted successfully"
}
```

---

## Members

### `GET /tournaments/:tournamentId/members` → `200`

```json
{
  "members": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "userId": "uuid",
      "roleId": "uuid",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "displayName": "Juan Pérez",
      "avatarUrl": null,
      "roleName": "OWNER"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `POST /tournaments/:tournamentId/members` → `201`

```json
{
  "member": {
    "id": "uuid",
    "tournamentId": "uuid",
    "userId": "uuid",
    "roleId": "uuid",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### `PATCH .../members/:memberId` → `200`

```json
{
  "member": {
    "id": "uuid",
    "tournamentId": "uuid",
    "userId": "uuid",
    "roleId": "uuid",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### `DELETE .../members/:memberId` → `200`

```json
{
  "message": "Member removed successfully"
}
```

---

## Categories

### `GET /tournaments/:tournamentId/categories` → `200`

```json
{
  "categories": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "title": "Sub-15",
      "minAge": 13,
      "maxAge": 15,
      "description": null,
      "order": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /tournaments/:tournamentId/categories` → `201`

```json
{
  "category": {
    "id": "uuid",
    "tournamentId": "uuid",
    "title": "Sub-15",
    "minAge": 13,
    "maxAge": 15,
    "description": null,
    "order": 1,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### `PATCH /categories/:id` → `200`

Mismo shape: `{ "category": { ... } }`

### `DELETE /categories/:id` → `200`

```json
{
  "message": "Category deleted successfully"
}
```

---

## Teams

### `GET /tournaments/:tournamentId/teams` → `200`

```json
{
  "teams": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "categoryId": "uuid",
      "name": "Águilas FC",
      "abbreviation": "AGU",
      "logoUrl": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `POST /tournaments/:tournamentId/teams` → `201`

```json
{
  "team": {
    "id": "uuid",
    "tournamentId": "uuid",
    "categoryId": "uuid",
    "name": "Águilas FC",
    "abbreviation": "AGU",
    "logoUrl": null
  }
}
```

### `PATCH /teams/:id` → `200`

Mismo shape: `{ "team": { ... } }`

### `DELETE /teams/:id` → `200`

```json
{
  "message": "Team deleted successfully"
}
```

---

## Players

### `GET /tournaments/:tournamentId/players` → `200` (privado)

### `GET /teams/:teamId/players` → `200` (público)

```json
{
  "players": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "categoryId": "uuid",
      "teamId": "uuid",
      "firstName": "Carlos",
      "lastName": "Ramírez",
      "birthDate": "2010-05-12",
      "number": 10,
      "isCaptain": false,
      "role": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `POST /tournaments/:tournamentId/players` → `201`

```json
{
  "player": {
    "id": "uuid",
    "tournamentId": "uuid",
    "categoryId": "uuid",
    "teamId": "uuid",
    "firstName": "Carlos",
    "lastName": "Ramírez",
    "birthDate": "2010-05-12",
    "number": 10,
    "isCaptain": false,
    "role": null
  }
}
```

### `PATCH /players/:id` → `200`

Mismo shape: `{ "player": { ... } }`

### `DELETE /players/:id` → `200`

```json
{
  "message": "Player deleted successfully"
}
```

---

## Matches

### `GET /tournaments/:tournamentId/matches` (+ `/public`) → `200`

```json
{
  "matches": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "categoryId": "uuid",
      "homeTeamId": "uuid",
      "awayTeamId": "uuid",
      "scheduledAt": "2026-06-10T18:00:00.000Z",
      "venue": "Estadio Central",
      "status": "scheduled",
      "homeTeam": {
        "id": "uuid",
        "name": "Águilas FC",
        "abbreviation": "AGU",
        "logoUrl": null
      },
      "awayTeam": {
        "id": "uuid",
        "name": "Leones",
        "abbreviation": "LEO",
        "logoUrl": null
      },
      "category": {
        "id": "uuid",
        "title": "Sub-15"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /matches/:id` → `200`

```json
{
  "match": {
    "id": "uuid",
    "tournamentId": "uuid",
    "categoryId": "uuid",
    "homeTeamId": "uuid",
    "awayTeamId": "uuid",
    "scheduledAt": "2026-06-10T18:00:00.000Z",
    "venue": "Estadio Central",
    "status": "scheduled",
    "homeTeam": {
      "id": "uuid",
      "name": "Águilas FC",
      "abbreviation": "AGU",
      "logoUrl": null
    },
    "awayTeam": {
      "id": "uuid",
      "name": "Leones",
      "abbreviation": "LEO",
      "logoUrl": null
    },
    "category": {
      "id": "uuid",
      "title": "Sub-15"
    }
  }
}
```

### `POST /tournaments/:tournamentId/matches` → `201`

Shape **plano** (sin homeTeam/awayTeam embebidos):

```json
{
  "match": {
    "id": "uuid",
    "tournamentId": "uuid",
    "categoryId": "uuid",
    "homeTeamId": "uuid",
    "awayTeamId": "uuid",
    "scheduledAt": "2026-06-10T18:00:00.000Z",
    "venue": "Estadio Central",
    "status": "scheduled"
  }
}
```

### `PATCH /matches/:id` → `200`

Mismo shape plano: `{ "match": { ... } }`

### `DELETE /matches/:id` → `200`

```json
{
  "message": "Match deleted successfully"
}
```

---

## Match events

### `GET /matches/:matchId/events` → `200`

```json
{
  "events": [
    {
      "id": "uuid",
      "matchId": "uuid",
      "eventType": "gol",
      "minute": 23,
      "teamId": "uuid",
      "playerId": "uuid",
      "assistedByPlayerId": "uuid",
      "description": null
    }
  ]
}
```

### `POST /matches/:matchId/events` → `201`

```json
{
  "event": {
    "id": "uuid",
    "matchId": "uuid",
    "eventType": "gol",
    "minute": 23,
    "teamId": "uuid",
    "playerId": "uuid",
    "assistedByPlayerId": "uuid",
    "description": null
  }
}
```

### `DELETE /match-events/:id` → `200`

```json
{
  "message": "Match event deleted successfully"
}
```

---

## Standings

Base: `/tournaments/:tournamentId/categories/:categoryId`

### `GET .../standings` → `200`

```json
{
  "standings": [
    {
      "teamId": "uuid",
      "played": 5,
      "won": 3,
      "drawn": 1,
      "lost": 1,
      "goalsFor": 10,
      "goalsAgainst": 4,
      "goalDifference": 6,
      "points": 10
    }
  ]
}
```

### `GET .../top-scorers` → `200`

```json
{
  "topScorers": [
    {
      "playerId": "uuid",
      "goals": 7,
      "assists": 2
    }
  ]
}
```

### `GET .../cards` → `200`

```json
{
  "cards": [
    {
      "playerId": "uuid",
      "yellowCards": 2,
      "redCards": 0
    }
  ]
}
```
