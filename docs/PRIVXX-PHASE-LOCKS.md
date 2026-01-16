# 🔒 PRIVXX — PHASE LOCK REGISTRY (AUTHORITATIVE)

**Document Status:** CANONICAL  
**Last Updated:** 2026-01-16  
**Owner:** Bulldog  

> This document is the **single source of truth** for all locked phases.  
> If something conflicts with this document, **THIS DOCUMENT WINS**.

---

## Table of Contents

1. [Phase 2 — Bridge Integration & Protocol](#phase-2--bridge-integration--protocol)
2. [Phase 3.1 — Backend Messaging Core](#phase-31--backend-messaging-core)
3. [Phase 3.2 — Bridge Messaging API](#phase-32--bridge-messaging-api)

---

# Phase 2 — Bridge Integration & Protocol

**Status:** LOCKED ✅  
**Date Locked:** 2026-01-16

## What Phase 2 Includes

- Frontend → Bridge authenticated integration
- Supabase JWT verification enforced on protected endpoints
- Identity session lifecycle (locked → unlocked)
- Controlled connection initiation via `connect_intent`
- Strict envelope validation at the bridge
- CORS verified for `https://privxx.app`

## Architecture (Locked)

```
Frontend (https://privxx.app) → HTTPS → Bridge API (https://api.privxx.app) → localhost → Backend (xxDK owner)
```

- Frontend NEVER talks to backend directly
- Backend NEVER exposed publicly (127.0.0.1:8790)
- Bridge is the ONLY public API surface (127.0.0.1:8090 via Cloudflare)

## Domains (Locked)

| Domain | Purpose | Returns |
|--------|---------|---------|
| `https://privxx.app` | Frontend ONLY | HTML/SPA |
| `https://api.privxx.app` | API/Bridge ONLY | JSON |

⚠️ `privxx.app` MUST NEVER be used for API calls. `api.privxx.app` MUST NEVER serve HTML.

## Session Lifecycle (Locked)

```
LOCKED → POST /unlock → UNLOCKED (TTL) → POST /connect → CONNECTING → SECURE → POST /disconnect → IDLE → TTL expiry → LOCKED
```

## Phase 2 Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | None | Readiness check (`xxdkReady`) |
| POST | `/unlock` | JWT | Unlock identity session |
| POST | `/connect` | JWT | Start secure connection (`connect_intent`) |
| GET | `/status` | JWT | Session / connection state |
| POST | `/disconnect` | JWT | Tear down tunnel |
| POST | `/lock` | JWT | Manually lock session |
| GET | `/unlock/status` | JWT | Get unlock status |

## Required Connect Envelope

```json
{
  "v": 1,
  "type": "connect_intent",
  "requestId": "client-generated-uuid",
  "targetUrl": "https://example.com"
}
```

## Frontend Hooks (Canonical)

**Location:** `src/hooks/usePrivxxPhase2.ts`

**Exports:**
- `usePrivxxHealth(pollMs?)` — Phase 1 readiness polling
- `useUnlockSession(token)` — Unlock identity session
- `useConnect(token)` — Initiate connection with envelope

**Types:**
- `HealthResponse`
- `UnlockResponse`
- `ConnectAck`
- `PrivxxUiState`

## Phase 2 Lock Statement

> "Phase 2 integration is complete and verified. No changes to Phase 2 API surface or hooks without version bump."

---

# Phase 3.1 — Backend Messaging Core

**Status:** LOCKED ✅  
**Date Locked:** 2026-01-16  
**Phase:** 3.1 — Backend Messaging Core (DESIGN ONLY)

## What is Locked

**Phase 3.1 = Backend Messaging Core (DESIGN ONLY)** is FINAL and will not be re-litigated.

## Non-Negotiable Rules

1. Backend is the **sole xxDK owner**
2. Bridge never decrypts / never handles plaintext
3. Frontend never encrypts / never handles xxDK
4. Backend APIs to Bridge are **local-only**
5. Network format is **MessageEnvelope v1** only
6. No extra metadata fields beyond defined schema
7. Storage is local, append-only, ciphertext-at-rest

## Locked Schemas

### Network Message (sent over cMixx)

```
MessageEnvelope {
  v: 1
  messageId: UUIDv7
  conversationId: SHA256(sorted(senderID+peerID))
  senderId: xxID
  timestamp: unixMillis
  ciphertext: bytes
}
```

### Internal Plaintext (never leaves backend memory)

```
MessagePayload {
  type: "text"
  body: string
}
```

### Local Storage Records

```
StoredMessage {
  messageId
  conversationId
  senderId
  timestamp
  ciphertext
  direction
}

Conversation {
  conversationId
  peerId
  lastMessageAt
  unreadCount
}
```

## Locked Backend Interfaces (local-only)

```
SendMessage(ctx, recipientID, payload)
ListConversations(ctx)
GetMessages(ctx, conversationID, sinceTimestamp)
MarkRead(ctx, conversationID)
```

## Explicitly Out of Scope (Phase 4+)

- Group chats
- Attachments
- Edits/deletes
- Multi-device sync
- Push notifications

## Phase 3.1 Lock Statement

> "Phase 3.1 backend messaging design is final. No changes without explicit Phase 4 approval."

---

# Phase 3.2 — Bridge Messaging API

**Status:** LOCKED ✅  
**Date Locked:** 2026-01-16  
**Phase:** 3.2 — Bridge Messaging API (DESIGN ONLY)

## Purpose

Define the **public Bridge API contract** that exposes **messaging functionality** to the frontend while preserving Privxx's core guarantees:

- Zero plaintext exposure outside backend
- Bridge as **policy + auth gate only**
- Backend as **sole xxDK + crypto owner**
- Frontend as **dumb client** (no crypto, no keys)

This phase defines **WHAT exists**, not how it is implemented yet.

## Global Rules (Non-Negotiable)

1. All Phase 3.2 endpoints **require Supabase JWT**
2. Bridge NEVER:
   - decrypts messages
   - constructs ciphertext
   - touches xxDK
3. Bridge forwards requests **locally** to backend only
4. All message content handled by Bridge is **opaque**
5. JSON schemas are **versioned** (`v`)
6. Any endpoint not listed here **does not exist**

## Authentication

### Required Header (ALL endpoints)

```http
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
```

## Phase 3.2 Lock Statement

> "Phase 3.2 bridge messaging API design is final. No changes without explicit Phase 4 approval."

---

# Summary

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 2 | Bridge Integration & Protocol | ✅ LOCKED |
| Phase 3.1 | Backend Messaging Core (Design) | ✅ LOCKED |
| Phase 3.2 | Bridge Messaging API (Design) | ✅ LOCKED |
| Phase 3.3 | Implementation | 🔲 NOT STARTED |
| Phase 4 | Extensions (Groups, Attachments, etc.) | 🔲 FUTURE |

---

*Privxx Team — Privacy-first by design*
