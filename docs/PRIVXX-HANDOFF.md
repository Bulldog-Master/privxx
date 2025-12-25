# Privxx Project Handoff

## What Privxx Is
Privxx is a privacy-first access layer designed to protect metadata
while keeping the user experience calm, modern, and human-friendly.

---

## Current Status
- UI and brand are locked
- Demo flow is stable
- Routing is currently simulated (mock mode)
- Documentation is complete and authoritative
- Backend at `https://privxx.app` exists but proxy not yet connected

---

## What Is Locked (Do Not Change)
- UI layout
- Background and gradients
- Logo usage
- Button styles
- Copy and wording
- Demo flow

See:
- brand-ui-lock.md
- PRIVXX-DESIGN-CONSTITUTION.md

---

## What Is Actively Being Worked On
- Phase D: cMixx proof-of-integration
- Replace simulated routing with real cMixx control-channel events
- Logging and observability

UI must not change during this phase.

---

## Where to Start Reading
1. docs/README.md
2. PRIVXX-ONE-PAGER.md
3. PRIVXX-FOUNDATION-PITCH.md
4. PHASE-D-PLAIN-CHECKLIST.md
5. PRIVXX-VERSIONING.md

---

## How to Avoid Breaking Things
If you are unsure whether a change is allowed:
- Check `PRIVXX-WHAT-CHANGES-WHAT-DOESNT.md`
- If it affects visuals, assume **no**

---

## Guiding Principle
Privxx values:
- trust over flash
- clarity over cleverness
- privacy without intimidation

---

# FRONTEND API HANDOFF (For ChatGPT / External AI)

**Last Updated:** 2025-01-25

---

## ARCHITECTURE (LOCKED — MODEL B)

```
Browser (React UI)
    ↓
/api/backend/* (same-origin proxy)
    ↓
Edge Function (server-to-server)
    ↓
https://privxx.app (real backend via Cloudflare Tunnel)
```

### Rules:
- ❌ **NO** direct browser → backend calls (no CORS fighting)
- ❌ **NO** browser visibility into xxdk/cmixx/NDF/gateways/nodes
- ✅ Browser ONLY calls `/api/backend/*`
- ✅ Mock mode enabled until proxy is deployed

---

## CURRENT STATE

| Item | Status |
|------|--------|
| Frontend | Running in **mock mode** |
| Real backend URL | `https://privxx.app` |
| Proxy edge functions | **Not created yet** (waiting for backend stability) |
| Direct backend calls | Removed ✅ |

---

## API CONTRACT (UI ↔ Proxy)

All endpoints are **same-origin** (`/api/backend/*`):

### GET /api/backend/health
```json
{ "ok": true }
```

### GET /api/backend/status
```json
{
  "state": "starting" | "ready" | "error",
  "detail": "optional string"
}
```

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

### GET /api/backend/messages
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

## KEY FILES

### `src/lib/privxx-api.ts`
- Single source of truth for all backend API calls
- Exports: `health()`, `status()`, `messages()`, `sendMessage()`
- `MOCK_MODE = true` by default (until proxy deployed)
- When mock mode off, calls `/api/backend/*` endpoints

### `src/hooks/useBackendStatus.ts`
- Polls `status()` every 30 seconds
- Returns: `{ status, error, isLoading }`
- Status shape: `{ state, detail?, isMock }`

### `src/components/BackendHealthIndicator.tsx`
- Shows connection status indicator
- Displays "(Demo)" label when in mock mode

---

## UI BEHAVIOR RULES

| State | UI Behavior |
|-------|-------------|
| `state === "starting"` | Show "Starting..." + spinner + amber indicator |
| `state === "ready"` | Show "Live" + green indicator, enable messaging |
| `state === "error"` | Show "Backend unavailable" + retry option |

### Privacy Rules:
- **NEVER expose**: xxdk versions, NDF sources, gateways, nodes, internal errors
- **ALWAYS show**: Generic user-friendly messages

---

## i18n REQUIREMENTS

- All UI strings use translation keys via `useTranslations()` hook
- Translation files: `public/locales/{lang}/ui.json`
- Supported: en, es, fr, pt, de, ar, ru, bn, zh, hi, ur, id, ja, nl, tr, ko
- **NO hardcoded text** in components

---

## REAL BACKEND CONTRACT (for proxy implementation)

When proxy is created, it maps to these real endpoints:

| Proxy Endpoint | Real Backend |
|----------------|--------------|
| `/api/backend/health` | `https://privxx.app/cmixx/status` |
| `/api/backend/status` | `https://privxx.app/cmixx/status` (transformed) |
| `/api/backend/messages` | `https://privxx.app/cmixx/inbox` |
| `/api/backend/send` | `https://privxx.app/cmixx/send` (501 Not Implemented) |

**Transform rules:**
- Real `ready: true` + `phase: "running"` → `state: "ready"`
- Real `ready: false` → `state: "starting"`
- Network error → `state: "error"`

---

## NEXT STEPS (when backend is stable)

1. Enable Lovable Cloud
2. Create edge functions for `/api/backend/*` endpoints
3. Edge functions call `https://privxx.app` server-to-server
4. Set `MOCK_MODE = false` in privxx-api.ts
5. Test end-to-end flow

---

## DO NOT

- Add direct `fetch('https://privxx.app/...')` calls from browser code
- Expose internal error messages to UI
- Store any user data in localStorage
- Add analytics, tracking, or cookies

---

## TECH STACK

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- i18next for translations
- Lovable Cloud (Supabase) for edge functions (pending)

---

*END OF HANDOFF*
