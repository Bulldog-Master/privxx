# API Contract

The Bridge API is the only surface the frontend calls.

## OpenAPI Specification

- Location: `docs/openapi.yaml`
- Version: 1.0.0

## Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check (public) |
| `/status` | GET | Yes | Bridge status |
| `/auth/session` | POST | Yes | Validate session token |
| `/identity/status` | GET | Yes | Get identity state |
| `/identity/create` | POST | Yes | Create identity (one-time) |
| `/identity/unlock` | POST | Yes | Unlock identity |
| `/identity/lock` | POST | Yes | Lock identity |
| `/messages/send` | POST | Yes | Send message |
| `/messages/inbox` | GET | Yes | Read inbox |

## Authentication

All authenticated endpoints require a Bearer JWT token in the `Authorization` header.

```
Authorization: Bearer <jwt_token>
```

## Error Responses

All errors return a consistent structure:

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}
```

## Correlation ID

All responses include an optional `X-Correlation-Id` header for request tracing.
