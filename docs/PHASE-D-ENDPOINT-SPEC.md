# Phase D Endpoint Spec (Minimal Listener Server)

## Purpose
Define a minimal HTTP interface for the Phase D "Listener Server" so we can:
- observe health
- trigger a connect flow (optional for debugging)
- inspect session status (optional for debugging)

Important: Phase D's proof path is **cMixx control-channel messaging**.
These endpoints exist for observability and simple testing only.

---

## Base URL
Local development example:
- `http://localhost:8787`

(Exact port may change.)

---

## Endpoints

### 1) GET /health

#### Purpose
Verify the listener server is running.

#### Request
- Method: GET
- Body: none

#### Response (200)
```json
{
  "ok": true,
  "service": "privxx-listener",
  "version": "phase-d",
  "time": "2025-12-14T12:00:00Z"
}
```

#### Notes
- Must always respond quickly (<100ms local).
- No auth required in Phase D.

---

### 2) POST /connect (Optional Debug)

#### Purpose
Allow a simple non-cMixx debug path to validate message structure and logging.
This is optional but useful early.

#### Request
- Method: POST
- Content-Type: application/json
- Body: same structure as `connect_intent`

#### Example
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

#### Response (200)
Return the same structure as `connect_ack`:
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

#### Error Response (400)
```json
{
  "ok": false,
  "errorCode": "INVALID_MESSAGE"
}
```

#### Notes
- This endpoint must not alter the locked UI directly.
- It exists to validate schema, logging, and status handling.

---

### 3) GET /status?sessionId=…

#### Purpose
Allow checking the last known status for a session (debug/observability).

#### Request
- Method: GET
- Query param: `sessionId` (required)

#### Example
`/status?sessionId=sess_001`

#### Response (200)
```json
{
  "ok": true,
  "sessionId": "sess_001",
  "status": "connected",
  "lastSeen": "2025-12-14T12:00:02Z",
  "targetUrl": "https://example.com"
}
```

#### Error (404)
```json
{
  "ok": false,
  "errorCode": "UNKNOWN_SESSION"
}
```

---

## Logging Requirements (Phase D Evidence)

Server must log (stdout is fine):
- receipt of `connect_intent`
- validation pass/fail
- ACK sent
- `sessionId` + `requestId` correlation

Client must log:
- intent sent
- ack received
- event-driven Secure transition

These logs are used in:
`PHASE-D-SUCCESS-LOG-TEMPLATE.md`

---

## Out of Scope
- Authentication / accounts
- Persistent database storage
- Payment processing
- Full browsing proxy routing
- Production hardening
