# 🔒 PRIVXX FRONTEND HANDOFF — BRIDGE CONTRACT (AUTHORITATIVE)

**Status:** LOCKED  
**Audience:** Lovable / Frontend Devs / Bridge Implementer  
**Architecture:** Frontend → Bridge → Backend (xxdk)

---

## GLOBAL CONTEXT

This document REPLACES all previous frontend assumptions.

Backend and bridge are now stable.  
Architecture is **LOCKED**.

**DO NOT DEVIATE FROM THIS CONTRACT.**

---

## 1. ARCHITECTURE (FINAL)

```
Browser / App UI
       ↓
    Bridge API
  https://<bridge-domain>
       ↓
  Backend (xxdk)
  (NOT internet-facing)
```

### Rules:
- ❌ Frontend NEVER talks directly to backend
- ❌ Backend is NOT internet-facing
- ❌ No CORS fixes — bridge handles everything
- ✅ Bridge is the ONLY API exposed
- ✅ All CORS, auth, validation live in bridge
- ✅ Frontend treats backend as opaque

---

## 2. BRIDGE API CONTRACT

**Base URL:** `https://<bridge-domain>` (set via `VITE_BRIDGE_URL`)

All responses are JSON. All requests use HTTPS only.

---

### GET /status

Health + readiness check.

**Response 200:**
```json
{
  "status": "ok",
  "backend": "connected",
  "network": "ready"
}
```

| Field | Values |
|-------|--------|
| `status` | `"ok"` \| `"error"` |
| `backend` | `"connected"` \| `"disconnected"` \| `"error"` |
| `network` | `"ready"` \| `"connecting"` \| `"error"` |

---

### POST /identity/unlock

Unlock backend identity (bridge mediates).

**Request:**
```json
{
  "password": "<user_password>"
}
```

**Response 200:**
```json
{
  "unlocked": true
}
```

**Response 401:**
```json
{
  "error": "invalid_password"
}
```

---

### POST /identity/lock

Lock backend identity.

**Response 200:**
```json
{
  "locked": true
}
```

---

### POST /message/send

Send a message via xxdk.

**Request:**
```json
{
  "recipient": "<id | alias>",
  "message": "<string>"
}
```

**Response 200:**
```json
{
  "msg_id": "<id>",
  "status": "queued"
}
```

---

### GET /message/receive

Poll or stream received messages.

**Response 200:**
```json
{
  "messages": [
    {
      "from": "<id>",
      "message": "<string>",
      "timestamp": "<iso8601>"
    }
  ]
}
```

---

### POST /session/refresh

Refresh auth/session token.

**Response 200:**
```json
{
  "token": "<new_token>",
  "expires_in": 3600
}
```

---

## 3. FRONTEND API CLIENT

**File:** `src/lib/privxx-api.ts`

### Key Exports:

| Function | Purpose |
|----------|---------|
| `status()` | GET /status — health check |
| `unlockIdentity(req)` | POST /identity/unlock |
| `lockIdentity()` | POST /identity/lock |
| `sendMessage(req)` | POST /message/send |
| `receiveMessages()` | GET /message/receive |
| `refreshSession()` | POST /session/refresh |
| `isMockMode()` | Check if running in mock mode |
| `getBridgeUrl()` | Get configured bridge URL |

### Mock Mode:

When `VITE_BRIDGE_URL` is not set, the client runs in mock mode with simulated responses.

---

## 4. STATUS HOOK

**File:** `src/hooks/useBackendStatus.ts`

### Returns:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `BackendStatus` | Current bridge/backend state |
| `error` | `string \| null` | Error message if any |
| `isLoading` | `boolean` | Initial loading state |
| `refetch` | `() => void` | Manual refresh |

### BackendStatus Shape:

```typescript
{
  status: "ok" | "error";
  backend: "connected" | "disconnected" | "error";
  network: "ready" | "connecting" | "error";
  isMock: boolean;
}
```

---

## 5. UI STATE MAPPING

| Bridge State | UI State | Behavior |
|--------------|----------|----------|
| `status: "error"` or `backend: "error"` | Error | "Backend unavailable" + Retry |
| `backend: "disconnected"` or `network: "connecting"` | Connecting | Spinner + "Connecting..." |
| All OK | Ready | Enable messaging UI |

### NEVER show:
- Gateway info
- Versions
- NDF
- Stack traces
- xxdk internals

---

## 6. SECURITY MODEL (FRONTEND)

### Frontend assumes:
- Bridge can reject requests
- Bridge enforces rate limits
- Bridge sanitizes responses
- Backend is invisible

### Frontend must:
- Never store secrets
- Never embed passwords
- Never assume availability
- Always handle 401 / 429 / 5xx

---

## 7. ENVIRONMENT CONFIGURATION

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_BRIDGE_URL` | Bridge API base URL | No (mock mode if absent) |

---

## 8. WHAT STAYS VALID

- ✅ UI / UX components
- ✅ State management
- ✅ Auth flows (via bridge)
- ✅ Messaging UI
- ✅ Status indicators
- ✅ i18n / translations
- ✅ PWA functionality

---

## 9. WHAT WAS REMOVED

- ❌ Direct backend URLs
- ❌ `/api/backend/*` proxy endpoints
- ❌ `health()` function (replaced by `status()`)
- ❌ Old `state: "starting" | "ready" | "error"` pattern
- ❌ Backend-specific error parsing

---

## 10. FINAL LOCK

This is NOT a temporary change.  
This is the production architecture.

All frontend work going forward MUST:
- Use bridge APIs exclusively
- Treat backend as opaque
- Follow this contract exactly

Any deviation reintroduces security risks and instability.

---

*Architecture locked.*
