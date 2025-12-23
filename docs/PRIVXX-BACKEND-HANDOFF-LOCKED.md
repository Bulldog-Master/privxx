# PRIVXX BACKEND HANDOFF — LOCKED CONTRACT

**Status:** STABLE & LIVE  
**Backend Version:** Privxx Bridge (xxdk v4 ONLY)  
**Environment:** Production via Cloudflare Tunnel  
**Date Locked:** 2025-12-23

This document is the authoritative backend contract for the Privxx App.
Frontend work may proceed immediately based on this contract.
No assumptions beyond what is documented here should be made.

---

## HIGH-LEVEL SUMMARY

- Backend is live, stable, and reachable publicly
- xxdk client/v4 is used (client/v5 is NOT used)
- Cloudflare tunnel is correctly configured
- Identity is initialized and persistent
- Messaging SEND is intentionally NOT implemented yet
- Read-only messaging + status endpoints are complete

This is the correct stage for frontend integration.

---

## BASE URLS

| Environment | URL |
|-------------|-----|
| Primary | `https://privxx.app` |
| Secondary | `https://www.privxx.app` |
| Local (backend testing only) | `http://127.0.0.1:8090` |

---

## AVAILABLE ENDPOINTS (LOCKED)

### 1) GET /cmixx/status

**Purpose:** Mixnet health & readiness

**Response (200 OK):**
```json
{
  "ok": true,
  "mode": "real",
  "mixnet": "cmixx",
  "ready": true,
  "phase": "ready",
  "uptimeSec": 12345,
  "inboxCount": 0,
  "now": 1703347200000
}
```

---

### 2) GET /cmixx/inbox

**Purpose:** Read-only inbox state

**Response (200 OK):**
```json
{
  "ok": true,
  "mode": "real",
  "count": 0,
  "items": []
}
```

**Notes:**
- Inbox exists
- No messages expected yet
- Safe to poll

---

### 3) POST /cmixx/send

**Purpose:** Message sending (NOT YET ENABLED)

**Request:**
```json
{
  "to": "<string>",
  "body": "<string>"
}
```

**Response (EXPECTED): 501 Not Implemented**
```json
{
  "ok": false,
  "mode": "real",
  "error": "not implemented (E2E wiring pending)"
}
```

**IMPORTANT:**
- This endpoint intentionally fails
- Frontend MUST handle 501 gracefully
- UI should show "Coming soon" / disabled state

---

### 4) GET /xxdk/info

**Purpose:** Safe backend + xxdk state info

**Response (200 OK):**
```json
{
  "ok": true,
  "mode": "real",
  "dataDir": "/opt/xx/backend/state",
  "ndfPath": "/opt/xx/backend/config/ndf.json",
  "phase": "ready",
  "ready": true,
  "uptimeSec": 12345,
  "now": 1703347200000,
  "note": "safe info only (no IsReady / no GetNodeRegistrationStatus)"
}
```

---

### 5) GET /xxdk/client

**Purpose:** Identity exposure (read-only)

**Response (200 OK):**
```json
{
  "ok": true,
  "mode": "real",
  "transmissionId": "<base64>",
  "receptionId": "<base64>",
  "now": 1703347200000,
  "note": "IDs from local identity/storage"
}
```

**Notes:**
- Identity is persistent
- No identity mutation endpoints exist yet
- Frontend may display IDs

---

## ERROR BEHAVIOR (INTENTIONAL)

| Condition | Response |
|-----------|----------|
| GET on POST-only routes | 405 |
| POST on GET-only routes | 405 |
| Invalid JSON | 400 |
| Missing fields | 400 |
| Root path (/) | 404 |
| No /health or /debug routes | By design |

---

## SECURITY & DESIGN NOTES

- No node, gateway, or NDF details exposed to UI
- Backend controls all xxdk internals
- UI only sees safe, abstracted state
- This is intentional and correct

---

## FRONTEND GUIDANCE

### Frontend MAY safely implement:

- App shell
- Status indicators
- Identity display
- Connection health UI
- Error handling
- Mock → real API switching
- Disabled messaging UI

### Frontend MUST NOT assume:

- Message sending works
- Inbox will populate yet
- Identity creation/reset flows
- Any xxdk mutation actions

---

## NEXT BACKEND PHASE (NOT PART OF THIS HANDOFF)

- Wire E2E send logic
- Enable message delivery
- Inbox population
- Optional auth & session logic

These will be added later without breaking this contract.

---

## HANDOFF CONFIRMATION

This backend is **LOCKED**.
Any future changes will be additive only.
Breaking changes will not occur without coordination.

---

*End of document.*
