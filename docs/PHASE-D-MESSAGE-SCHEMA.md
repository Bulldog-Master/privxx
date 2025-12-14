# Phase D Message Schema (Control Channel Only)

## Purpose
Define the minimal message formats used in Phase D to:
- send a connection intent via cMixx
- receive an acknowledgement via cMixx
- trigger the Secure state from a real event

This schema is intentionally simple and non-final.
It exists to prove integration, not to define production protocol.

---

## Design Principles
- Minimal fields
- Human-readable JSON
- Versioned messages (`v`)
- Correlate request/response (`sessionId`, `requestId`)
- No sensitive data beyond what is needed for the demo

---

## Message Types
Phase D uses exactly two message types:

1) `connect_intent`
2) `connect_ack`

No other message types are in scope for Phase D.

---

## 1) Connect Intent (Client → Server)

### Type
`connect_intent`

### Example Payload
```json
{
  "v": 1,
  "type": "connect_intent",
  "requestId": "req_abc123",
  "sessionId": "sess_001",
  "targetUrl": "https://example.com",
  "clientTime": "2025-12-14T12:00:00Z"
}
```

### Field Definitions
- `v` (number): schema version (Phase D uses 1)
- `type` (string): must be `connect_intent`
- `requestId` (string): unique request identifier (client-generated)
- `sessionId` (string): session identifier for this UI connection attempt
- `targetUrl` (string): the URL entered by the user (Phase D uses this as intent only)
- `clientTime` (string): ISO timestamp (optional but recommended)

### Validation Rules
Server must reject if:
- `type` is not `connect_intent`
- `targetUrl` is empty
- `requestId` or `sessionId` missing

---

## 2) Connect ACK (Server → Client)

### Type
`connect_ack`

### Example Payload
```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "req_abc123",
  "sessionId": "sess_001",
  "ack": true,
  "status": "connected",
  "serverTime": "2025-12-14T12:00:02Z"
}
```

### Field Definitions
- `v` (number): schema version (Phase D uses 1)
- `type` (string): must be `connect_ack`
- `requestId` (string): must match the incoming intent `requestId`
- `sessionId` (string): must match the incoming intent `sessionId`
- `ack` (boolean): must be `true` to trigger Secure
- `status` (string): `connected` (Phase D only)
- `serverTime` (string): ISO timestamp (optional)

### Trigger Rule (Critical)
Client transitions UI **Connecting → Secure** only when:
- `type == "connect_ack"`
- `ack == true`
- `requestId` and `sessionId` match the in-flight request

**If any check fails, do NOT set Secure.**

---

## Error Handling (Phase D Minimal)

Phase D may include a simple error response, but it is optional.

If implemented, use:

### Type
`connect_ack` with `ack: false`

### Example
```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "req_abc123",
  "sessionId": "sess_001",
  "ack": false,
  "status": "error",
  "errorCode": "INVALID_URL"
}
```

### Allowed errorCode values (Phase D)
- `INVALID_URL`
- `INVALID_MESSAGE`
- `SERVER_BUSY`

### Client behavior
- Remain in Connecting briefly, then return to Idle with a friendly message
- UI visuals remain unchanged (locked)

---

## Out of Scope
- Encryption payload schemas (handled by cMixx/xxDK)
- Authentication, user accounts
- Payment payloads
- Full proxy/browsing request formats

---

## Evidence Requirements

Phase D proof requires logs showing:
- `connect_intent` sent
- `connect_intent` received
- `connect_ack` sent
- `connect_ack` received
- Secure state triggered by ACK (not timer)
