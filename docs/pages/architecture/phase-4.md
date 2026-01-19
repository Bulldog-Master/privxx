# Phase 4 — Backend Hardening

Phase 4 established the **hardened backend foundation** with strict separation between Bridge (public API) and Backend Core (localhost only).

**Status:** ✅ LOCKED  
**Date:** 2026-01-19  
**Commits:** 3d09cb5, 4fc19ca

---

## Architecture (Final)

```
Frontend (Lovable)
       ↓ HTTPS (same-origin)
Bridge (Public API — :8090)
       ↓ localhost RPC
Backend Core (xxDK owner — :8091)
       ↓ cMixx
XX Network
```

---

## Key Guarantees

| Guarantee | Enforcement |
|-----------|-------------|
| Frontend ONLY talks to Bridge | Same-origin policy (https://privxx.app) |
| Backend Core is NOT internet-facing | Bound to 127.0.0.1:8091 only |
| Bridge does NOT expose backend-only routes | Hard-disabled at code level |

---

## Bridge API (Public)

### GET /health

The only public endpoint in Phase 4.

| Property | Value |
|----------|-------|
| URL | `https://privxx.app/health` |
| Auth | None |
| Headers | `Cache-Control: no-store` |

**Response:**
```json
{
  "status": "ok",
  "version": "0.4.0",
  "xxdkReady": false
}
```

**Frontend Rule:** Health is informational only — not a readiness gate.

---

## Backend Core (Localhost Only)

### GET http://127.0.0.1:8091/health

Internal health endpoint for Bridge → Backend Core verification.

**Response:**
```json
{
  "status": "ok",
  "version": "0.4.0",
  "capabilities": {
    "messaging": true,
    "decrypt": true,
    "tunnel": false
  }
}
```

**Access:** NOT internet reachable — localhost only.

---

## Frontend Rules (Mandatory)

1. ✅ Call ONLY Bridge (same origin), never backend direct
2. ✅ Do NOT cache health responses
3. ✅ Do NOT call `/xxdk/*` or `/cmixx/*` (404 by design)
4. ✅ Health is informational only, not readiness gating
5. ✅ No frontend changes required for Phase 4

---

## Lock Rules

| Rule | Scope |
|------|-------|
| No edits to `/health` handlers | Bridge + Backend |
| No bridge route expansion | Bridge |
| No backend exposure | Infrastructure |
| All changes require Phase 5 branch | Governance |
| Build box state is authoritative | PROD |

---

## What Phase 4 Delivers

- ✅ Hardened Bridge ↔ Backend separation
- ✅ Health/capabilities plumbing
- ✅ xxDK readiness signaling
- ✅ Zero backend exposure risk

---

## What Phase 4 Does NOT Include

- ❌ Messaging APIs (Phase 5)
- ❌ Tunnel/connect endpoints (Phase 5)
- ❌ Session unlock/lock (Phase 5)
- ❌ JWT-protected routes (Phase 5)

---

## Phase 4 Completion Criteria

- [x] Bridge bound to :8090, Backend to :8091 (localhost)
- [x] `/health` endpoint live and returning JSON
- [x] Backend `/health` includes capabilities object
- [x] Admin/internal routes hard-disabled
- [x] CORS restricted to https://privxx.app
- [x] Documentation locked

---

## Next Phase

Phase 4 is complete. See [Phase 5](./phase-5.md) for Unlock/Connect/Messaging API implementation.

---

## Lock Statement

> **🔒 Phase 4 (Backend Hardening) is complete and frozen.**  
> No infrastructure changes permitted without explicit Phase 5 approval.  
> Build box state is authoritative for production.
