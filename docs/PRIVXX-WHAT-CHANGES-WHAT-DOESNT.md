# Privxx — What Changes vs What Doesn't

## Purpose
This document prevents scope creep and UI drift by separating:
- what is **frozen**
- what is allowed to **evolve**

If a change violates this document, it should be reverted.

---

## What Does NOT Change (Frozen)
These are locked and must remain consistent across all phases:

### UI & Brand
- Background style and overall look
- Glass/gradient UI language
- Button styling and hierarchy
- Privxx logo usage (no variations)
- Typography and spacing patterns

### User Flow
- The 3 core states:
  - Idle → Connecting → Secure
- The meaning of each state
- The structure and placement of the privacy drawer

### Copy & Disclosure
- Clear "demo/prototype" disclosure where applicable
- No misleading security or privacy claims

---

## What CAN Change (Allowed)
Only underlying behavior and implementation may evolve:

### Phase D (cMixx Proof)
- The trigger used to move from Connecting → Secure
  - simulated timer → real cMixx event
- Logging and observability
- Internal routing/session handling
- Reliability improvements and error handling

### Later Phases
- Expanding from control-channel privacy to full routing/proxy behavior
- Payment rail coordination logic
- Mobile-native integration details

---

## Rule of Thumb
If a user can *see* the change, it is probably out of scope for Phase D.

---

## Enforcement
- UI changes require explicit approval and an update to `brand-ui-lock.md`.
- Any conflict is resolved in favor of:
  1) `brand-ui-lock.md`
  2) `PRIVXX-DESIGN-CONSTITUTION.md`
  3) this document
