# Phase D — cMixx Demo Narrative

**What changes when real privacy routing goes live**

---

## Overview

Phase D replaces the simulated connection with real cMixx mixnet routing.

From the user's perspective, almost nothing changes visually.  
From a privacy perspective, everything changes.

---

## What Stays The Same

| Element | Status |
|---------|--------|
| UI design | **Unchanged** — locked and final |
| Logo, colors, gradients | **Unchanged** |
| Button behavior | **Unchanged** |
| Status flow (Idle → Connecting → Secure) | **Unchanged** |
| Privacy drawer content | **Unchanged** |
| Language selector | **Unchanged** |

**The user sees the same app.**

---

## What Changes (Under The Hood)

| Before (Phase 1) | After (Phase D) |
|------------------|-----------------|
| Simulated 2-3 second delay | Real cMixx routing latency |
| Fake "Connected" status | Real encrypted session |
| No actual privacy | Real metadata protection |
| Demo disclaimer visible | Demo disclaimer removed |

---

## User Experience Walkthrough

### Step 1: Open Privxx

User sees the same interface:
- Privxx logo (gradient + xx mark)
- URL input field
- "Connect through Privxx" button
- Status: **Idle**

*No visible difference from Phase 1.*

---

### Step 2: Enter URL and Click Connect

User pastes a URL and clicks the button.

**What the user sees:**
- Button changes to "Connecting..."
- Status shows animated gradient
- Slight delay (real this time)

**What actually happens:**
1. Privxx bridge initializes xxDK client
2. Post-quantum keys are negotiated
3. cMixx session opens to Privxx server
4. Encrypted control message sent through mixnet
5. Server responds through cMixx

*User doesn't see any of this — just the familiar connecting animation.*

---

### Step 3: Connection Established

**What the user sees:**
- Status changes to **Secure**
- Button shows "Connected"
- Real latency displayed (e.g., "1,287 ms")

**What's different:**
- The latency is real (measured round-trip through cMixx)
- The session is actually encrypted
- Metadata is actually protected

---

### Step 4: Demo Notice Gone

The footer no longer shows:  
> "Demo mode — routing simulated"

This signals to the user that privacy is now real.

---

## What Users Should Feel

| Phase 1 (Simulation) | Phase D (Real) |
|----------------------|----------------|
| "This looks like it works" | "This actually works" |
| "I'm testing the concept" | "I'm using real privacy" |
| "Demo disclaimer present" | "Disclaimer gone = real" |

---

## Technical Summary (For Stakeholders)

Phase D proves:
- ✅ xxDK can be integrated via bridge layer
- ✅ cMixx session setup is stable
- ✅ Round-trip messaging works
- ✅ Latency is acceptable for control channel
- ✅ UI requires zero changes

This validates the architecture before building full HTTP proxy routing.

---

## What Phase D Does NOT Include

- ❌ Full website rendering through Privxx
- ❌ Cookie/session handling
- ❌ JavaScript execution in proxied content
- ❌ Payment flow integration

These come in later phases after Phase D proves the foundation.

---

## Success Criteria

Phase D is complete when:

1. User clicks "Connect through Privxx"
2. Real cMixx session is established
3. Control message travels through mixnet
4. Server responds through mixnet
5. UI shows "Secure" with real latency
6. Demo disclaimer is removed

**No UI changes required. Privacy becomes real.**
