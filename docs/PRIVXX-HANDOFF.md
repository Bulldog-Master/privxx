# 🔒 PRIVXX FRONTEND HANDOFF — FINAL (AUTHORITATIVE)

**Status:** LOCKED  
**Backend + Bridge:** HARDENED  
**Frontend:** MUST FOLLOW THIS DOCUMENT

---

## 1. ARCHITECTURE (LOCKED)

```
Frontend → Bridge → Backend (xxdk)
```

### Rules (non-negotiable):
- ❌ Frontend NEVER talks to backend
- ❌ Backend is NOT exposed to internet
- ✅ Bridge is the ONLY HTTP surface
- ✅ All CORS, auth, rate limits live in bridge
- ✅ Backend runs as long-lived client only

Any frontend code assuming direct backend access is INVALID and must be removed.

---

## 2. BRIDGE API CONTRACT (SOURCE OF TRUTH)

**Base URL:** `https://<bridge-domain>` (set via `VITE_BRIDGE_URL`)

All requests: HTTPS, JSON, Stateless (session via token)

---

### GET /status

```json
{
  "status": "ok",
  "backend": "connected",
  "network": "ready"
}
```

| Field | Values |
|-------|--------|
| `status` | `"ok"` |
| `backend` | `"connected"` \| `"disconnected"` |
| `network` | `"ready"` \| `"syncing"` |

---

### POST /identity/unlock

**Request:**
```json
{ "password": "<string>" }
```

**Response 200:**
```json
{ "unlocked": true }
```

**Response 401:**
```json
{ "error": "invalid_password" }
```

---

### POST /identity/lock

**Response 200:**
```json
{ "locked": true }
```

---

### POST /message/send

**Request:**
```json
{
  "recipient": "<id>",
  "message": "<string>"
}
```

**Response 200:**
```json
{
  "msg_id": "<string>",
  "status": "queued"
}
```

---

### GET /message/receive

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

**Response 200:**
```json
{
  "token": "<string>",
  "expires_in": 3600
}
```

---

## 3. TYPESCRIPT CLIENT SDK

**Files:**
- `src/api/bridge/client.ts` — BridgeClient class
- `src/api/bridge/mockClient.ts` — MockBridgeClient for offline dev
- `src/api/bridge/index.ts` — Singleton instance + exports

### Usage:

```typescript
import { bridgeClient, isMockMode } from "@/api/bridge";

// Check status
const status = await bridgeClient.status();

// Unlock identity
await bridgeClient.unlock(password);

// Send message
const msgId = await bridgeClient.sendMessage(recipient, message);

// Receive messages
const messages = await bridgeClient.receiveMessages();

// Check if running in mock mode
if (isMockMode()) {
  console.log("Running in demo mode");
}
```

### Mock Mode:

When `VITE_BRIDGE_URL` is not set or `VITE_MOCK=true`, MockBridgeClient is used automatically.

---

## 4. SEQUENCE DIAGRAMS

### 🔐 Identity Unlock

```
User
  │  password
  ▼
Frontend
  │  POST /identity/unlock
  ▼
Bridge
  │  unlock identity
  ▼
Backend (xxdk)
```

### ✉️ Send Message

```
User
  │  message text
  ▼
Frontend
  │  POST /message/send
  ▼
Bridge
  │  cmix send
  ▼
Backend (xxdk)
  │  async delivery
  ▼
Network
```

### 📥 Receive Message

```
Frontend
  │  GET /message/receive
  ▼
Bridge
  │  poll backend queue
  ▼
Backend (xxdk)
  │  messages
  ▼
Bridge
  │  JSON
  ▼
Frontend
```

---

## 5. SECURITY MODEL (FRONTEND)

### Frontend MUST:
- Never store secrets
- Never embed passwords
- Never talk to backend
- Treat bridge as untrusted boundary
- Handle 401 / 429 / 5xx gracefully

### Frontend MUST NOT:
- Retry backend directly
- Assume network stability
- Parse xxdk errors
- Expose internal IDs

---

## 6. ENVIRONMENT CONFIGURATION

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_BRIDGE_URL` | Bridge API base URL | No (mock mode if absent) |
| `VITE_MOCK` | Force mock mode | No |

---

## 7. FILE STRUCTURE

```
src/api/bridge/
├── client.ts      # BridgeClient class (real API)
├── mockClient.ts  # MockBridgeClient (offline dev)
└── index.ts       # Singleton + exports
```

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

- ❌ Direct backend URLs (`/api/backend/*` proxy pattern)
- ❌ `src/lib/privxx-api.ts` (replaced by `src/api/bridge/`)
- ❌ Old `state: "starting" | "ready" | "error"` pattern
- ❌ Backend-specific error parsing

---

## 10. FINAL LOCK

This document supersedes all prior frontend guidance.

If frontend code violates this:
- Security risk
- Bottleneck risk
- Production instability

**Architecture is FINAL.**

---

*Privxx Team — Privacy-first by design*
