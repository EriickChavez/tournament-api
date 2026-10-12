Son solo dos encabezados propios, y puedes mandarlos en **todas** las peticiones.

| Encabezado      | Valor                   | Cuándo                                                   |
| --------------- | ----------------------- | -------------------------------------------------------- |
| `Accept`        | `application/json`      | siempre                                                  |
| `X-Client-Type` | `mobile`                | siempre. Obligatorio en el login, inofensivo en el resto |
| `Authorization` | `Bearer <sessionToken>` | todas menos el login                                     |
| `Content-Type`  | `application/json`      | solo en peticiones con cuerpo (`POST`, `PUT` y `PATCH`)  |

- **Peticiones sin datos:** `start`, `finish`, `reopen` y `logout` son `POST`. Manda `{}` como cuerpo, con su `Content-Type`.
- **Sin cookies:** el login móvil no las pone. En iOS desactiva el manejo de cookies para que no se mezclen.
- **`401`:** el token venció o es inválido. Borra el token guardado y manda al usuario al login.

## Android (OkHttp)

```kotlin
class AuthInterceptor(private val tokenStore: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val builder = chain.request().newBuilder()
            .header("Accept", "application/json")
            .header("X-Client-Type", "mobile")
        tokenStore.token?.let { builder.header("Authorization", "Bearer $it") }
        return chain.proceed(builder.build())
    }
}

// POST sin datos (start/finish/reopen/logout):
val empty = "{}".toRequestBody("application/json".toMediaType())
```

OkHttp no guarda cookies si no le pasas un `CookieJar`, así que no hay que hacer nada más.

## iOS (Swift)

```swift
func makeRequest(_ path: String, method: String = "GET", body: Data? = nil) -> URLRequest {
    var req = URLRequest(url: URL(string: baseURL + path)!)
    req.httpMethod = method
    req.httpShouldHandleCookies = false
    req.setValue("application/json", forHTTPHeaderField: "Accept")
    req.setValue("mobile", forHTTPHeaderField: "X-Client-Type")
    if let token = Keychain.token {
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    if let body {
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body
    }
    return req
}

// POST sin datos: makeRequest("/matches/\(id)/start", method: "POST", body: Data("{}".utf8))
```

## Ejemplos completos

**Login**

```
POST /auth/login
Accept: application/json
X-Client-Type: mobile
Content-Type: application/json

{"email":"...","password":"..."}
```

Responde `{ "user": {...}, "sessionToken": "...", "expiresAt": "..." }`.

**Registrar un gol**

```
POST /matches/{matchId}/events
Accept: application/json
X-Client-Type: mobile
Authorization: Bearer {sessionToken}
Content-Type: application/json

{"eventType":"gol","teamId":"...","playerId":"...","minute":34,
 "clientEventId":"<UUID>","occurredAt":"2026-10-12T18:34:05-06:00"}
```

Los nombres de los encabezados no distinguen mayúsculas. Los valores de `clientEventId` y `occurredAt` se generan en el momento del evento, no cuando se reenvía desde la cola.
