# 🔒 PRIVXX — DIAGNOSTICS UX, DEMO SCRIPT & FAILURE MAP

**Status:** AUTHORITATIVE  
**Applies to:** Frontend (Lovable), Demo Mode, Production Path  
**Architecture:** Frontend → Proxy → Bridge → xxDK / cMixx (LOCKED)

---

## 1. PURPOSE

This document defines exactly how Privxx diagnostics, demos, and connection visibility must work.

**Goals:**
- Enable credible live demos
- Provide clear diagnostics without leaking infrastructure
- Explain failures accurately and calmly
- Preserve production-grade security boundaries

This is not cosmetic UX. This is trust infrastructure.

---

## 2. DIAGNOSTICS UI — CONNECTION PATH (REQUIRED)

### Default View (Always Visible)

The diagnostics UI MUST show a logical connection path, not raw URLs:

```
Client (Browser)
   ↓
Proxy (Public)
   ↓
Bridge (Local)
   ↓
xxDK Client
```

Each layer shows a status indicator:
- ✅ Connected
- ⏳ Initializing
- ⚠️ Degraded
- ❌ Unreachable

### Rules (Non-Negotiable)

- ❌ No IP addresses
- ❌ No ports
- ❌ No localhost references
- ❌ No backend-only topology

This view is safe for demos, screenshots, and non-technical users.

---

## 3. ADVANCED / TECHNICAL VIEW (OPT-IN ONLY)

Add a toggle:

> "Show technical details"

When enabled, the UI MAY reveal:
- Full URL (masked IP if possible)
- Port number
- Error code
- Timeout / refusal reason
- Correlation ID

This mirrors best practice from:
- Cloudflare
- Vercel
- Supabase
- Datadog

**Default state: OFF**

---

## 4. STATUS COPY — EXACT WORDING

### Global Status

| Status | Description |
|--------|-------------|
| **Connected** | All layers operational |
| **Degraded** | Some layers reachable, limited functionality |
| **Offline** | Unable to reach service |

### Layer Descriptions

| Layer | Description |
|-------|-------------|
| **Client (Browser)** | Your device |
| **Proxy (Public)** | Public entry point |
| **Bridge (Local)** | Secure API boundary |
| **xxDK Client** | Private network client |

---

## 5. FAILURE → EXPLANATION MAP (CRITICAL)

This table defines what the UI means and what to say out loud during a demo.

| UI State | What's Actually Happening | Correct Explanation |
|----------|---------------------------|---------------------|
| Proxy ❌ | DNS / Cloudflare / SSL down | "The public entry point is unreachable." |
| Bridge ❌ | Bridge service stopped or tunnel misconfigured | "The secure API boundary isn't reachable yet." |
| xxDK ⏳ | Identity locked or client initializing | "The private client is starting — this is expected." |
| xxDK ❌ | Identity panic or startup failure | "The private client failed to initialize." |
| Send blocked | Identity locked | "Identity protection is working as designed." |

🚫 **Never say:**
- "Bug"
- "Frontend issue"
- "CORS problem"

---

## 6. LIVE DEMO SCRIPT (≤ 60 SECONDS)

### Step 1 — Load App

Open: `https://privxx.app`

**Say:**
> "Privxx is designed so the browser never holds cryptographic identity or keys."

### Step 2 — Open Diagnostics

Navigate to: `/diagnostics`

Point to Connection Path.

**Say:**
> "This shows the logical path — client, proxy, bridge, private client — without exposing infrastructure."

### Step 3 — Unlock Identity

Click **Unlock Secure Identity**.

**Say:**
> "Unlocking is session-based. The identity never enters the browser."

**Expected:**
- Status → Connected
- Identity → Unlocked

### Step 4 — Send Message to Self

Compose:
- Recipient: Self
- Message: "Privxx live demo test"

Click **Send**.

**Say:**
> "Messages route Frontend → Bridge → xxDK → cMixx. There is no direct backend access."

### Step 5 — Wait for Inbox

Wait 10–20 seconds.

**Say:**
> "cMixx is asynchronous. The delay is the privacy feature, not a bug."

**Expected:**
- Message appears
- Timestamp shows delayed arrival

### Step 6 — Lock Identity

Click **Lock Identity**.

**Say:**
> "Once locked, messaging stops immediately — even with the tab open."

**Expected:**
- Inbox stops updating
- Send disabled

---

## 7. PRIVXX-SPECIFIC GUIDANCE FOR LOVABLE

### What Lovable SHOULD DO

- ✅ Show logical connection layers
- ✅ Show status indicators per layer
- ✅ Provide actionable explanations
- ✅ Include "Advanced / Technical" toggle
- ✅ Help users understand why something failed

### What Lovable MUST NOT DO

- ❌ Expose raw IPs by default
- ❌ Show localhost bindings
- ❌ Leak backend ports
- ❌ Imply frontend ↔ backend direct access

---

## 8. ARCHITECTURE TRUTH (LOCKED)

```
Frontend (Web / App)
   ↓ HTTPS
Proxy (Cloudflare / Public)
   ↓ Private Route
Bridge (Local, Hardened)
   ↓
xxDK / cMixx
```

**Rules:**
- Frontend NEVER talks to xxDK directly
- Bridge is the ONLY API surface
- Backend is NOT internet-facing
- Diagnostics explain reality, not guess

---

## 9. FINAL POSITIONING LINE (USE THIS VERBATIM)

> "Privxx is not a mock demo.  
> It is a production-correct system demonstrating real privacy constraints, real routing delays, and real security boundaries — before optimization."

---

**Document Status:** FINAL  
**Applies Immediately**  
**Any deviation re-introduces security and trust risk**
