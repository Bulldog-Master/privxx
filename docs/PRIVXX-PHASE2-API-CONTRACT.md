# PRIVXX API CONTRACT — PHASE 2 (DRAFT, NOT LIVE YET)

**Status:** DRAFT  
**Last Updated:** 2026-01-15

---

## Origins

| Purpose | URL |
|---------|-----|
| Frontend (SPA) | `https://privxx.app` |
| API / Bridge | `https://api.privxx.app` |

---

## Phase 1 (LIVE NOW)

### GET /health

Public health check — no authentication required.

**Response 200:**
```json
{
  "status": "ok",
  "version": "0.4.0",
  "xxdkReady": true
}
```

**CORS:**
- `Access-Control-Allow-Origin: https://privxx.app`

---

## Phase 2 (TO BE IMPLEMENTED)

All Phase 2 endpoints require a valid Supabase JWT in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

### POST /session/unlock

Unlock the identity session with a password.

**Request:**
```json
{
  "password": "..."
}
```

**Response 200:**
```json
{
  "ok": true
}
```

**Response 401/403:**
```json
{
  "ok": false,
  "error": "locked" | "invalid" | "expired"
}
```

---

### POST /connect

Initiate a cMixx tunnel connection to a target URL.

**Request:**
```json
{
  "targetUrl": "https://example.com"
}
```

**Response 200:**
```json
{
  "ok": true
}
```

---

### GET /session/state

Get the current identity session state.

**Response 200:**
```json
{
  "state": "locked" | "unlocked" | "starting" | "error",
  "detail": "optional detail message"
}
```

---

### GET /tunnel/status

Get the current tunnel connection status.

**Response 200:**
```json
{
  "state": "idle" | "connecting" | "secure",
  "latencyMs": 123,
  "detail": "optional detail message"
}
```

---

## Explicitly NOT AVAILABLE

These routes are not part of the Phase 1 or Phase 2 contract:

- `/cmixx/*` — 404 expected
- `/xxdk/*` — 404 expected
- `/status` — 404 expected (use `/session/state` or `/tunnel/status` instead)

Any unlisted route returns 404.

---

## Phase 2 Implementation Checklist

### Backend (Go Bridge)
- [ ] Add JWT validation middleware
- [ ] Implement `/session/unlock` endpoint
- [ ] Implement `/session/state` endpoint
- [ ] Implement `/connect` endpoint
- [ ] Implement `/tunnel/status` endpoint
- [ ] Add rate limiting per endpoint

### Frontend (React)
- [ ] Create `useSessionState` hook
- [ ] Create `useTunnelStatus` hook
- [ ] Update identity unlock flow to call `/session/unlock`
- [ ] Update connection flow to call `/connect`
- [ ] Add token refresh handling for 401 responses

### CORS
- [ ] Ensure all Phase 2 endpoints return proper CORS headers
- [ ] Allow `Authorization` header in preflight

---

*Privxx Team — Privacy-first by design*
