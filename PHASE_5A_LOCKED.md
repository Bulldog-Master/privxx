# PHASE 5A LOCKED — Backend-only Messaging Stubs (PROD safe)

Date: 2026-01-19
Scope: backend-core only (127.0.0.1:8091). Bridge remains locked (no public message routes).

## Routes (backend-core)
- POST /v1/message/send
- GET  /v1/message/inbox
- GET  /v1/message/thread?conversationId=...

## Requirements
- Requires headers: X-User-Id, X-Request-Id
- Stub-safe: no persistence, no xxDK, no plaintext storage beyond request body
- Responses:
  - message_send_ack includes messageId: "msg-stub-1"
  - inbox/thread return empty messages arrays

## Security / exposure
- Bridge (8090) returns 404 for all /v1/message/* routes (confirmed)
