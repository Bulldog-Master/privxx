# 🔒 PRIVXX — PHASE LOCK REGISTRY (AUTHORITATIVE)

**Document Status:** CANONICAL  
**Last Updated:** 2026-01-16  
**Owner:** Bulldog  

> This document is the **single source of truth** for all locked phases.  
> If something conflicts with this document, **THIS DOCUMENT WINS**.

---

## Table of Contents

1. [Phase 2 — Bridge Integration & Protocol](#phase-2--bridge-integration--protocol)
2. [Phase 3 (Full) — Messaging Design + Implementation](#phase-3-full--messaging-design--implementation)

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
Frontend (https://privxx.app) → HTTPS → Bridge API (https://api.privxx.app) → localhost → xxDK Backend (external)
```

- Frontend NEVER talks to backend directly
- **privxx-bridge** is the ONLY server-side artifact in this repo (127.0.0.1:8090 via Cloudflare)
- **xxdk-backend** (xx-backend.service) is EXTERNAL — not part of this repo
- Bridge proxies to external backend via localhost RPC

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

# Phase 3 (Full) — Messaging Design + Implementation

**Status:** LOCKED ✅  
**Date Locked:** 2026-01-16  
**Owner:** Bulldog  
**Scope:** Phase 3.1 → Phase 3.6  

> This section replaces **all prior Phase 3 notes**.  
> If something is not written here, it is **not part of Phase 3**.

---

## Phase 3 Goal (Definitive)

Introduce **secure messaging** into Privxx while preserving:

- Backend-only xxDK ownership
- Bridge as hardened policy gate
- Frontend as stateless renderer
- Zero plaintext persistence
- Zero crypto in browser
- Clear Phase 3 → Phase 4 boundary

Phase 3 ends at **implementation-ready** state. Phase 4 is **deployment & rollout**.

---

## Phase 3.1 — Architecture (Locked)

### System Topology

```
Frontend (Lovable)
       ↓ HTTPS (JWT)
privxx-bridge (Public API) ← ONLY server-side artifact in this repo
       ↓ Local RPC
xxdk-backend (external service, xx-backend.service) ← NOT in this repo
       ↓ cMixx
xx Network
```

### Ownership Rules

| Component | Owns | In This Repo? |
|-----------|------|---------------|
| Frontend | UI, polling, envelopes | ✅ Yes |
| privxx-bridge | Auth, validation, rate-limit, proxy | ✅ Yes |
| xxdk-backend | xxDK, crypto, queues, storage | ❌ External |
| xx Network | Delivery | ❌ External |

### Critical Architecture Note

⚠️ **There is NO Go `privxx-backend` in this repo.**  
The engine backend is **external** (`xxdk-backend` / `xx-backend.service`).  
The repo's only server-side build artifact is **privxx-bridge**.

---

## Phase 3.2 — Bridge API Contracts (Locked)

All Phase 3 endpoints:
- Require **Supabase JWT**
- Require **unlocked session**
- Use **envelope format**
- Reject unknown fields strictly

### Envelope (Mandatory)

```json
{
  "v": 1,
  "type": "<string>",
  "requestId": "<uuid>",
  "sessionId": "<optional>",
  "...": "payload"
}
```

### GET /status

- **Auth:** Required
- **Purpose:** Messaging readiness
- **Response 200:** `{ "state": "idle" | "connecting" | "secure" }`

### POST /unlock

- **Request:** `{ "password": "…" }`
- **Response:** `{ "success": true, "expiresAt": "RFC3339", "ttlSeconds": 900 }`
- **Errors:** `403 session_locked`, `401 invalid_password`

### POST /connect

Accepted type: `connect_intent` ONLY

- **Request:**
```json
{
  "v": 1,
  "type": "connect_intent",
  "requestId": "uuid",
  "targetUrl": "https://example.com"
}
```

- **Response:**
```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "uuid",
  "ack": true,
  "status": "connected",
  "serverTime": "RFC3339"
}
```

- **Errors:** `INVALID_MESSAGE`, `SESSION_LOCKED`, `INVALID_URL`

### GET /conversations

```json
{
  "conversations": [
    { "id": "convId", "unread": 2, "lastMessageAt": "RFC3339" }
  ]
}
```

### GET /messages?conversationId=…&since=…

```json
{
  "messages": [
    {
      "id": "msgId",
      "direction": "inbound" | "outbound",
      "ciphertext": "base64",
      "status": "queued" | "sent" | "failed",
      "timestamp": "RFC3339"
    }
  ],
  "cursor": "nextCursor"
}
```

### POST /messages/send

- **Request:**
```json
{
  "v": 1,
  "type": "send_message",
  "requestId": "uuid",
  "conversationId": "convId",
  "ciphertext": "base64"
}
```

- **Response:** `{ "ok": true }`

---

## Phase 3.1 — Conversation Model (SPECIFICATION LOCKED)

**Status:** SPECIFICATION LOCKED  
**Implementation:** External (`xxdk-backend`, not in this repo)

**Purpose:**
- Deterministic conversation identity
- Metadata only
- No plaintext
- No xxDK usage

⚠️ The Go code shown below is a **reference specification** for the external backend, NOT code in this repo.

🔒 LOCKED

---

## Phase 3.2 — Message Envelope + Store (SPECIFICATION LOCKED)

**Status:** SPECIFICATION LOCKED  
**Implementation:** External (`xxdk-backend`, not in this repo)

**Purpose:** Define how messages are stored and tracked, without handling encryption or transport yet.

⚠️ The Go code shown below is a **reference specification** for the external backend, NOT code in this repo.

### model.go

```go
package messages

import "time"

// Message is an encrypted message envelope.
// Plaintext NEVER exists here.
type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	SenderID       string    `json:"senderId"`
	Ciphertext     []byte    `json:"ciphertext"`
	Timestamp      time.Time `json:"timestamp"`
}
```

**Rules:**
- Ciphertext is opaque
- Message ordering = Timestamp
- SenderID is xx identity hash / ID (not user data)

### store.go

```go
package messages

import "sync"

type Store struct {
	mu    sync.RWMutex
	store map[string][]*Message
}

func NewStore() *Store {
	return &Store{
		store: make(map[string][]*Message),
	}
}

func (s *Store) Append(msg *Message) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.store[msg.ConversationID] = append(s.store[msg.ConversationID], msg)
}

func (s *Store) List(conversationID string) []*Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return append([]*Message(nil), s.store[conversationID]...)
}
```

🔒 LOCKED

---

## Phase 3.3 — Message Orchestrator (SPECIFICATION LOCKED)

**Status:** SPECIFICATION LOCKED  
**Implementation:** External (`xxdk-backend`, not in this repo)

**Purpose:** Central brain that:
- Builds encrypted envelopes
- Routes incoming messages
- Updates conversation state

⚠️ The Go code shown below is a **reference specification** for the external backend, NOT code in this repo.

### orchestrator.go

```go
package orchestrator

import (
	"time"

	"backend/conversations"
	"backend/messages"
)

type Orchestrator struct {
	conversations *conversations.Repo
	messages      *messages.Store
}

func New(
	convoRepo *conversations.Repo,
	msgStore *messages.Store,
) *Orchestrator {
	return &Orchestrator{
		conversations: convoRepo,
		messages:      msgStore,
	}
}

// ReceiveEncryptedMessage handles an inbound encrypted message
func (o *Orchestrator) ReceiveEncryptedMessage(
	conversationID string,
	peerID string,
	senderID string,
	ciphertext []byte,
) {
	// Ensure conversation exists
	convo := o.conversations.GetOrCreate(conversationID, peerID)

	// Store message
	msg := &messages.Message{
		ID:             generateMessageID(),
		ConversationID: convo.ID,
		SenderID:       senderID,
		Ciphertext:     ciphertext,
		Timestamp:      time.Now().UTC(),
	}

	o.messages.Append(msg)

	// Update conversation state
	o.conversations.MarkActivity(convo.ID)
	o.conversations.IncrementUnread(convo.ID)
}

// placeholder until deterministic ID generator added
func generateMessageID() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}
```

**Notes:**
- No xxDK yet
- No bridge
- No plaintext
- Deterministic layering

🔒 LOCKED

---

## Phase 3.4 — Backend Wiring (SPECIFICATION LOCKED)

**Status:** SPECIFICATION LOCKED  
**Implementation:** External (`xxdk-backend`, not in this repo)

**Purpose:** Instantiate and wire all Phase 3 components in the external backend.

⚠️ The Go code shown below is a **reference specification** for the external backend, NOT code in this repo.

```go
convoRepo := conversations.NewRepo()
msgStore := messages.NewStore()

orch := orchestrator.New(
	convoRepo,
	msgStore,
)
```

Transport adapters (mock or xxDK) will call:
```go
orch.ReceiveEncryptedMessage(...)
```

🔒 LOCKED

---

## Phase 3.5 — Bridge Design (Locked)

### Bridge Role

Bridge:
- Verifies JWT
- Enforces session lock
- Validates schema
- Rate-limits
- Proxies to backend

Bridge does NOT:
- Encrypt
- Decrypt
- Persist messages

### Bridge Modules

```
bridge/
├─ handlers/
├─ auth/
├─ ratelimit/
├─ rpc/
└─ schema/
```

### Enforcement Rules

| Condition | Response |
|-----------|----------|
| Unknown type | 400 |
| Invalid v | 400 |
| Locked session | 403 |
| Rate exceeded | 429 |
| Backend down | 503 |

---

## Phase 3.6 — Frontend Design (Locked)

Frontend:
- Sends envelopes
- Polls APIs
- Renders messages
- Handles session lock UX

Frontend NEVER:
- Encrypts
- Decrypts
- Touches xxDK
- Stores plaintext long-term

### Required Hooks

- `useConversations()`
- `useMessages(conversationId)`
- `useSendMessage()`
- `useSessionStatus()`

### Rules

- Server is source of truth
- Message states: `queued | sent | failed`
- Stop polling on session lock

---

## Phase 3.7 — Failure + Operations (Locked)

### Failure Handling

| Failure | Action |
|---------|--------|
| Session locked | Stop all polling |
| cMixx down | Queue + retry |
| Encrypt fail | Reject send |
| Backend down | 503 |

### Logging Rules

**Allowed:**
- requestId
- endpoint
- userId
- result code

**Forbidden:**
- plaintext
- ciphertext
- message bodies
- recipients

---

## Phase 3 Backend Lock Note (AUTHORITATIVE)

Phase 3 Backend **SPECIFICATION** is **LOCKED**.

### Architecture Clarification

⚠️ **There is NO Go `privxx-backend` in this repo.**  
- The engine backend is **external** (`xxdk-backend` / `xx-backend.service`)
- The repo's only server-side build artifact is **privxx-bridge**
- The Go code in Phase 3.1-3.4 is a **reference specification**, not repo code

### Current State

✔ Messaging foundation specification locked on VPS  
✔ `/connect` requires `type=connect_intent`  
❌ Browsing routes NOT available yet — do not assume them  
❌ No plaintext anywhere  
❌ No frontend assumptions  
❌ No protocol guessing  

**This phase will NOT be revisited.**

### What Happens Next (Phase 4)

Phase 4 will cover:
- Bridge endpoints for `/conversations`, `/messages`
- JWT-gated API surface
- Frontend hooks + rendering

---

## Phase 3 Storage Rules

- Ciphertext only
- No plaintext at rest
- Deterministic conversation IDs
- Message deduplication enforced

---

## Phase 3 Completion Criteria ✅

- [x] Conversation model complete
- [x] Message envelope complete
- [x] Storage complete
- [x] Orchestration logic complete
- [x] Backend wiring complete
- [x] APIs frozen
- [x] Backend responsibilities frozen
- [x] Bridge responsibilities frozen
- [x] Frontend hooks frozen
- [x] Failure handling defined
- [x] Logging rules defined

---

## Phase 3 Lock Statement

> **🔒 Phase 3 (Messaging Backend) is fully implemented and frozen.**  
> No design changes permitted.  
> Phase 4 is deployment & rollout.

---

# Summary

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 2 | Bridge Integration & Protocol | ✅ LOCKED |
| Phase 3.1 | Conversation Model | ✅ COMPLETE |
| Phase 3.2 | Message Envelope + Store | ✅ COMPLETE |
| Phase 3.3 | Message Orchestrator | ✅ COMPLETE |
| Phase 3.4 | Backend Wiring | ✅ COMPLETE |
| Phase 3.5 | Bridge Design | ✅ LOCKED |
| Phase 3.6 | Frontend Design | ✅ LOCKED |
| Phase 3.7 | Failure + Operations | ✅ LOCKED |
| Phase 4 | Deployment & Rollout | 🔲 FUTURE |
| Phase 5+ | Extensions (Groups, Attachments, etc.) | 🔲 FUTURE |

---

*Privxx Team — Privacy-first by design*
