# 🔒 PRIVXX FRONTEND EXECUTION PLAYBOOK (POST-HANDOFF) — LOCKED

**Status:** ACTIVE  
**Audience:** Lovable / Frontend Devs / Proxy Implementer (later)  
**Backend:** Blocked & isolated (xx team dependency acknowledged)

---

## GLOBAL CONTEXT (READ ONCE)

The frontend architecture for Privxx is **LOCKED**.

Backend instability does **NOT** block frontend progress.

This document defines:
- What frontend builds now
- How it integrates later
- What is forbidden
- How release readiness is verified
- How mobile/desktop evolve without rewrites

**DO NOT SPLIT THIS DOCUMENT.**  
**DO NOT REINTERPRET SECTIONS.**  
**DO NOT ADD ALTERNATE ARCHITECTURES.**

---

## ARCHITECTURE (FINAL — MODEL B / BFF)

```
Browser / App UI
       ↓
Same-Origin Proxy (BFF)
   /api/backend/*
       ↓
Server-to-Server Calls
       ↓
xx-backend (local agent / Cloudflare Tunnel)
   https://privxx.app
```

- ❌ Browser → backend direct calls are **FORBIDDEN**
- ❌ CORS fixes on backend are **NOT** a solution
- ❌ No backend internals exposed to UI

- ✅ UI calls ONLY `/api/backend/*`
- ✅ Mock mode allowed until proxy is live

---

## FRONTEND NON-NEGOTIABLE RULES

### Frontend MUST NOT:
- Touch xxdk
- Reference NDF, gateways, nodes
- Call `/cmixx/*` or `/xxdk/*` from browser
- Store user data in localStorage
- Add analytics, cookies, trackers
- Expose internal errors or versions

### Frontend MUST:
- Build against proxy contract only
- Use same-origin fetch
- Support mock mode
- Treat backend as opaque
- Show user-safe states only

---

## PUBLIC API CONTRACT (UI ↔ PROXY) — V1

All requests are **SAME ORIGIN**:

```
/api/backend/*
```

---

### GET /api/backend/health

**Response:**
```json
{ "ok": true }
```

---

### GET /api/backend/status

**Response:**
```json
{
  "state": "starting" | "ready" | "error",
  "detail": "optional string"
}
```

---

### POST /api/backend/send

**Request:**
```json
{
  "recipient": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "messageId": "string",
  "queued": true
}
```

---

### GET /api/backend/messages

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "from": "string",
      "body": "string",
      "timestamp": number
    }
  ]
}
```

---

## FRONTEND API CLIENT (SINGLE SOURCE)

**File:** `src/lib/privxx-api.ts`

See implementation in codebase. Key exports:
- `health()` — Check backend health
- `status()` — Get connection state
- `messages()` — Fetch inbox
- `sendMessage(req)` — Queue outbound message
- `isMockMode()` — Check if running in mock mode

---

## STATUS POLLING HOOK

**File:** `src/hooks/useBackendStatus.ts`

Returns:
- `status` — Current backend state (`starting`, `ready`, `error`)
- `error` — Error message if any
- `isLoading` — Initial loading state

Polls every 30 seconds by default.

---

## UI STATE RULES (MANDATORY)

| State | Behavior |
|-------|----------|
| `starting` | Spinner + "Starting…" + Retry |
| `ready` | Enable messaging UI |
| `error` | "Backend unavailable" + Retry |

### NEVER show:
- Gateway info
- Versions
- NDF
- Stack traces

---

## EDGE FUNCTION SPEC (FOR LATER)

Proxy implements `/api/backend/*`

**Transform rules:**
- Backend ready → `state: ready`
- Backend initializing → `state: starting`
- Timeout/error → `state: error`

**Timeout:** 3–5 seconds  
**No infinite retries**  
**No passthrough headers**

Return generic errors only.

---

## UI COMPLIANCE CHECKLIST

- [ ] No direct backend URLs in browser
- [ ] All calls via privxx-api.ts
- [ ] Mock mode works end-to-end
- [ ] i18n only (no hardcoded text)
- [ ] Mobile usable at 375px width
- [ ] Touch targets ≥ 44px
- [ ] No localStorage user data

---

## FRONTEND RELEASE CHECKLIST

- [ ] Production build succeeds
- [ ] Console clean
- [ ] Status polling works
- [ ] Offline/start/error UX correct
- [ ] Inbox empty state clean
- [ ] Send action optimistic
- [ ] Accessibility basics pass
- [ ] RTL languages render acceptably

---

## MOBILE / DESKTOP FORWARD PLAN

### Shared:
- API contract
- State machines
- Translations
- UX rules

### Web:
- React (current)

### Mobile (later):
- React Native
- Same API contract

### Desktop (later):
- Tauri / Electron
- Local proxy → local agent

**NO rewrite required.**

---

## FINAL WORD (DO NOT REOPEN)

- Architecture locked
- Proxy model enforced
- Backend isolated
- Frontend proceeds independently

If anyone proposes:

> Browser → backend direct access

→ **The answer is NO.**

---

*END OF DOCUMENT*
