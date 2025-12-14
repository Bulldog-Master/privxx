# Phase D Bridge — UI to cMixx State Mapping

> **Status:** ACTIVE  
> **Depends on:** UI Lock (complete)  
> **Goal:** Map current demo states to real cMixx-backed states without visual changes

---

## Purpose

This document defines how the Privxx UI connects to the cMixx backend during Phase D integration.

**Critical constraint:** The UI must remain visually identical. Only the underlying trigger mechanism changes.

---

## UI Invariants (MUST NOT CHANGE)

These elements are frozen and must not be modified during Phase D:

### Visual Elements
- ❄️ Background layers (teal spheres, gradient glow)
- ❄️ Ambient dot (single, above-left of logo)
- ❄️ Left-side controls (globe + privacy, stacked vertically)
- ❄️ Logo treatment (Priv gradient + teal xx mark)
- ❄️ Card styling (glassmorphism, border, blur)
- ❄️ Button gradients (warm-to-teal)
- ❄️ Status bar styling and position

### Copy / Text
- ❄️ All translation keys and values
- ❄️ Status messages (Idle/Connecting/Secure + subtexts)
- ❄️ Privacy drawer content
- ❄️ Demo disclaimer footer

### Behavior
- ❄️ Three-state flow: Idle → Connecting → Secure
- ❄️ Privacy drawer opens from right
- ❄️ Language selector dropdown behavior

---

## What Changes in Phase D

Only the **trigger mechanism** for state transitions:

| Current (Demo) | Phase D (cMixx) |
|----------------|-----------------|
| `setTimeout()` triggers Connecting → Secure | cMixx `connect_ack` triggers Secure |
| Random latency simulation | Real round-trip latency measurement |
| No network requests | Bridge HTTP calls to local companion |
| No session management | Real sessionId from cMixx |

---

## State Machine (Unchanged)

```
┌─────────┐     User clicks      ┌─────────────┐     cMixx ACK      ┌──────────┐
│  IDLE   │ ─────────────────▶  │ CONNECTING  │ ─────────────────▶ │  SECURE  │
└─────────┘                      └─────────────┘                     └──────────┘
     ▲                                  │
     │                                  │
     └──────────────────────────────────┘
              Error or timeout
```

**State names, visual treatments, and copy remain identical.**

---

## Bridge Architecture

```
┌──────────────────┐         HTTP          ┌──────────────────┐
│   Privxx UI      │ ◀─────────────────▶  │  Local Bridge    │
│   (React/Vite)   │   /connect, /status   │  (Go/Rust)       │
└──────────────────┘                       └──────────────────┘
                                                    │
                                                    │ cMixx
                                                    ▼
                                           ┌──────────────────┐
                                           │  Privxx Server   │
                                           │  (cMixx listener)│
                                           └──────────────────┘
```

### Bridge Endpoints (from PHASE-D-ENDPOINT-SPEC.md)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Verify bridge is running |
| `/connect` | POST | Send connect_intent, receive connect_ack |
| `/status` | GET | Query session status |

---

## Integration Points in UI Code

### Current Demo Implementation

```typescript
// ConnectionCard.tsx - current
const handleSubmit = async (e: FormEvent) => {
  onStateChange("connecting");
  
  // DEMO: setTimeout triggers transition
  const delay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
  
  onStateChange("connected");
};
```

### Phase D Implementation (target)

```typescript
// ConnectionCard.tsx - Phase D
const handleSubmit = async (e: FormEvent) => {
  onStateChange("connecting");
  
  // REAL: Bridge call triggers transition
  const response = await fetch('http://localhost:8080/connect', {
    method: 'POST',
    body: JSON.stringify({ targetUrl: url })
  });
  
  const ack = await response.json();
  if (ack.ack) {
    onStateChange("connected");
  } else {
    onStateChange("idle"); // Error case
  }
};
```

**Visual output is identical. Only the trigger source changes.**

---

## Success Criteria

Phase D is complete when:

1. ✅ Secure state triggered by real cMixx `connect_ack`
2. ✅ Latency reflects actual round-trip time
3. ✅ Session ID stored and usable
4. ✅ UI visuals unchanged (verified against canonical screenshots)
5. ✅ Logs show cMixx message flow

---

## Guardrails

To prevent UI drift during Phase D:

1. **Screenshot verification** — Compare live UI against `docs/screenshots/` after each change
2. **No "improvements"** — Functional changes only, no aesthetic touches
3. **Code review focus** — Any PR touching visual components requires design sign-off
4. **Rollback ready** — Demo mode can be re-enabled instantly if bridge fails

---

## Related Documents

- [`PHASE-D-ENDPOINT-SPEC.md`](PHASE-D-ENDPOINT-SPEC.md) — Bridge HTTP interface
- [`PHASE-D-MESSAGE-SCHEMA.md`](PHASE-D-MESSAGE-SCHEMA.md) — cMixx message formats
- [`PHASE-D-PLAIN-CHECKLIST.md`](PHASE-D-PLAIN-CHECKLIST.md) — Success checklist
- [`brand-ui-lock.md`](brand-ui-lock.md) — Visual lock enforcement
- [`screenshots/README.md`](screenshots/README.md) — Canonical screenshots
