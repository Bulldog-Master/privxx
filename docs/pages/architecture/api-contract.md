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
| `/unlock/status` | GET | Yes | Get unlock status |
| `/unlock` | POST | Yes | Unlock identity session |
| `/lock` | POST | Yes | Lock identity session |
| `/connect` | POST | Yes | Initiate connection (`connect_intent`) |
| `/disconnect` | POST | Yes | Tear down connection |
| `/session/issue` | POST | Yes | Issue capability session |
| `/message/inbox` | POST | Yes | Read inbox (session-gated) |
| `/message/thread` | POST | Yes | Read conversation thread (session-gated) |
| `/message/send` | POST | Yes | Send message (session-gated) |
| `/message/ack` | POST | Yes | Acknowledge messages (session-gated) |

## Session Capabilities (Phase 5)

Sessions are short-lived capability grants, NOT logins.

| Purpose | Scope | conversationId |
|---------|-------|----------------|
| `message_receive` | Inbox | NOT allowed |
| `message_receive` | Conversation | REQUIRED |
| `message_send` | Conversation | REQUIRED |

**Rules:**
- Inbox scope ≠ Conversation scope → 401
- Receive ≠ Send → 401
- All checks enforced server-side

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
