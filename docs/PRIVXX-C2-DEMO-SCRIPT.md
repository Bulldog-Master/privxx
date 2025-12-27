# PRIVXX — C2 PRODUCTION DEMO SCRIPT (AUTHORITATIVE)

**Goal:** Deliver an undeniable, repeatable, <60s demo proving **Supabase Auth → Bridge-only → xxDK+cMixx messaging** is real.  
**Model:** C2 (Production-grade): **JWT auth + Bridge-only access + session-based unlock TTL**.  
**Non-negotiable:** Frontend NEVER talks to xxDK/cMixx directly — only to the Bridge.

---

## 0) DEMO OUTCOME (WHAT YOU WILL SHOW)

✅ Login (Supabase) → ✅ Identity status → ✅ Create identity (first-time) → ✅ Unlock (TTL) → ✅ Send message (device A) → ✅ Receive message (device B) → ✅ Lock → ✅ Session expiry behavior

**Proof Point:** Message round-trip across devices through the XX Network mixnet (xxDK + cMixx) with Bridge enforcing JWT + unlock TTL.

---

## 1) PREREQUISITES (MUST BE TRUE BEFORE DEMO)

### 1.1 Required URLs

| Component | URL |
|-----------|-----|
| Frontend | `https://<YOUR_FRONTEND_DOMAIN>` |
| Bridge | `https://<YOUR_BRIDGE_DOMAIN>` *(or same-origin /api routed to bridge)* |

### 1.2 Required Bridge Endpoints (C2 Contract)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/auth/session` | Validate Supabase JWT |
| `GET` | `/identity/status` | Check identity exists + state |
| `POST` | `/identity/create` | Create new identity (first-time) |
| `POST` | `/identity/unlock` | Unlock identity (start TTL) |
| `POST` | `/identity/lock` | Lock identity (end session) |
| `POST` | `/messages/send` | Send message via mixnet |
| `GET` | `/messages/inbox` | Retrieve received messages |
| `GET` | `/status` | *(optional)* Bridge/system health |

### 1.3 Required Headers

All protected endpoints require:

```
Authorization: Bearer <SUPABASE_JWT>
```

### 1.4 Unlock TTL Defaults

| Environment | TTL |
|-------------|-----|
| Demo | 5–10 minutes (recommended for live demo) |
| Production | 15 minutes default |

### 1.5 Two Devices

- **Device A:** Desktop/laptop browser
- **Device B:** iPad/phone browser

*(No iPad devtools required. This is black-box proof.)*

---

## 2) PRE-DEMO BACKEND SMOKE CHECK (SSH LINUX SERVER)

> Run these before anyone is watching.

### 2.1 Verify bridge process is running

```bash
sudo systemctl status privxx-bridge || true
ps aux | egrep 'privxx|bridge' | grep -v egrep || true
```

### 2.2 Verify bridge port is listening

```bash
sudo ss -lntp | egrep ':80|:443|:8080|:8090' || true
```

### 2.3 Tail bridge logs during demo

```bash
sudo journalctl -u privxx-bridge -f
```

### 2.4 (Optional) Quick unauth health ping

If `/health` exists and is public:

```bash
curl -sS https://<YOUR_BRIDGE_DOMAIN>/health || true
```

---

## 3) DEMO FLOW (60 SECONDS, SCRIPTED)

### 3.1 Start State (show this first)

- Open Device A and Device B to the Frontend URL
- Ensure both are on the same build/version
- Ensure user is logged out or session known

---

## 4) STEP-BY-STEP DEMO (WITH PASS/FAIL CRITERIA)

### STEP 1 — Supabase Login (Device A)

**Action (Device A):**
1. Click Login
2. Complete Supabase auth (magic link / passkey / 2FA)

**Expected:**
- User is authenticated
- App shows "Authenticated" / "Session active"
- Behind the scenes: JWT exists in Supabase session

| Result | Criteria |
|--------|----------|
| ✅ PASS | App proceeds past login without errors |
| ❌ FAIL | Login loops or session not created |

---

### STEP 2 — Bridge Session Validation (Device A)

**Action (Device A):**
- App automatically calls: `POST /auth/session`

**Expected Response:**

```json
{ "userId": "<uuid>", "sessionValid": true }
```

| Result | Criteria |
|--------|----------|
| ✅ PASS | UI shows session valid / no auth error banner |
| ❌ FAIL | 401 unauthorized / invalid token |

---

### STEP 3 — Identity Status Check (Device A)

**Action (Device A):**
- App calls: `GET /identity/status`

**Expected Response (existing identity):**

```json
{ "exists": true, "state": "locked" }
```

**Expected Response (first-time):**

```json
{ "exists": false, "state": "none" }
```

| Result | Criteria |
|--------|----------|
| ✅ PASS | UI shows "Create Secure Identity" (if none) OR "Unlock Secure Messaging" (if locked) |
| ❌ FAIL | Errors, unexpected state |

---

### STEP 4 — Create Identity (ONLY IF state = none)

**Action (Device A):**
- Click "Create Secure Identity"
- App calls: `POST /identity/create`

**Expected Response:**

```json
{ "state": "locked" }
```

| Result | Criteria |
|--------|----------|
| ✅ PASS | UI transitions to "Unlock Secure Messaging" |
| ❌ FAIL | Errors, timeouts, or identity appears created but status still none |

> ⚠️ If identity already exists, SKIP this step.

---

### STEP 5 — Unlock Identity (Device A)

**Action (Device A):**
- Click "Unlock Secure Messaging"
- App calls: `POST /identity/unlock`

**Expected Response:**

```json
{ "state": "unlocked", "expiresAt": "2025-12-27T12:30:00Z" }
```

| Result | Criteria |
|--------|----------|
| ✅ PASS | UI shows "Connected" / "Messaging enabled"; Compose and Inbox become active |
| ❌ FAIL | 403 session_expired (unless re-auth required) or 401 invalid JWT |

---

### STEP 6 — Login & Unlock on Device B (cross-device proof)

**Action (Device B):**
1. Login with SAME Supabase user
2. App calls `POST /auth/session` then `GET /identity/status`
3. Click "Unlock Secure Messaging" if locked

| Result | Criteria |
|--------|----------|
| ✅ PASS | Device B reaches "Messaging enabled" state |
| ❌ FAIL | Second device cannot unlock; sessions conflict, lock each other out |

---

### STEP 7 — Send Message (Device A → Device B)

**Action (Device A):**
- In Compose, send:
  - **Recipient:** self or same-user contact id (demo mode)
  - **Message text:** `hello-from-A-<timestamp>`
- App calls: `POST /messages/send`

**Expected Response:**

```json
{ "messageId": "abc123", "queued": true }
```

| Result | Criteria |
|--------|----------|
| ✅ PASS | UI shows sent/queued state (optimistic insert) |
| ❌ FAIL | 403 session_expired, 500 errors, or send does nothing |

---

### STEP 8 — Receive Message (Device B Inbox)

**Action (Device B):**
- Inbox polling calls: `GET /messages/inbox` every 3–5s

**Expected:**
- Within 1–20 seconds (variable), the message appears in Device B inbox
- Message appears once (dedupe by messageId)

| Result | Criteria |
|--------|----------|
| ✅ PASS | Message appears on Device B; delay is variable (mixnet characteristic) |
| ❌ FAIL | Message never arrives; duplicates appear repeatedly |

---

### STEP 9 — Lock Identity (Device A and/or B)

**Action:**
- Click "Lock"

**Expected:**
- App calls: `POST /identity/lock`
- UI clears inbox (or hides it)
- Polling stops

| Result | Criteria |
|--------|----------|
| ✅ PASS | Inbox stops updating and returns to locked state |
| ❌ FAIL | Lock fails or inbox continues updating |

---

## 5) TTL EXPIRY DEMO (OPTIONAL BUT POWERFUL)

> Do this after the live demo, or in a second run.

### Step A — Wait for TTL expiration

(or reduce TTL to 1–2 minutes for demo)

When TTL passes, calls to `GET /messages/inbox` or `POST /messages/send` must return:

```json
{
  "error": "session_expired",
  "message": "Identity session has expired. Please unlock again."
}
```

| Result | Criteria |
|--------|----------|
| ✅ PASS | UI shows "Session expired → Unlock again"; no confusing raw errors |
| ❌ FAIL | Raw error shown or app crashes |

---

## 6) OBSERVABILITY (WHAT TO WATCH DURING DEMO)

### On SSH server logs

**Look for:**
- `auth validated (userId)`
- `identity unlocked (TTL)`
- `message send event`
- `message received event`
- `session expired events`

**Must NOT log:**
- ❌ JWTs
- ❌ Message content
- ❌ Identity keys
- ❌ Plaintext IP addresses

---

## 7) DEMO TROUBLESHOOTING (FAST FIX PATH)

### If Device B cannot unlock

- Check Bridge supports concurrent sessions for the same user
- Ensure unlock is user-scoped (not global singleton)

### If messages never arrive

- Confirm xxDK client is connected and ready
- Confirm inbox endpoint returns queued messages
- Ensure polling is active only when unlocked

### If session_expired happens immediately

- JWT `exp` or clock skew
- TTL set too short
- Bridge time sync issue (check NTP)

---

## 8) DEMO DONE DEFINITION (LOCKED)

The demo is considered **COMPLETE** when:

| Check | Criterion |
|-------|-----------|
| ✔ | Supabase login works |
| ✔ | Bridge JWT validation works |
| ✔ | Identity status + unlock works |
| ✔ | Message sent on Device A is received on Device B |
| ✔ | Lock works |
| ✔ | No direct frontend ↔ xxDK calls |

---

## 9) POST-DEMO "IMPRESSION" ONE-LINER (TRUTHFUL)

> "Privxx is an early-access privacy messaging client powered by the XX Network mixnet, using Supabase-authenticated Bridge-only access and session-based identity unlocks."

---

## 10) RELATED DOCUMENTS

| Document | Purpose |
|----------|---------|
| [Bridge Hardening Checklist](./PRIVXX-BRIDGE-HARDENING-CHECKLIST.md) | Security requirements for production |
| [Demo Script (Phase 1)](./PRIVXX-DEMO-SCRIPT.md) | Simulated demo for UI validation |
| [Full Demo Script](./PRIVXX-FULL-DEMO-SCRIPT.md) | Extended demo with Q&A prep |

---

*Last updated: 2025-12-27*
