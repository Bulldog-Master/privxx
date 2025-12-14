# Phase D — cMixx Proof Checklist (Plain English)

---

## Goal

Prove that Privxx can use real cMixx routing events to drive the UI state.

Nothing else.

---

## What Phase D Is

- A proof of integration
- A confidence milestone
- A demo of feasibility

---

## What Phase D Is NOT

- Full proxy routing
- Payment settlement
- Production security guarantees

---

## What Must Happen (in order)

1. A user clicks Connect through Privxx
2. Privxx sends a connection intent via cMixx
3. A response is received via cMixx
4. The UI switches to Secure
5. Logs show routing occurred

**If all five happen → Phase D succeeds.**

---

## What Must NOT Change

- UI appearance
- Button behavior
- Branding
- Copy
- Demo flow

Only the underlying trigger changes.

---

## Success Criteria

Phase D is complete when:

- Secure state is triggered by cMixx, not a timer
- Latency is acceptable for UX
- No visual regressions occur

---

## Why This Order Matters

By freezing UI first:

- engineering work is simpler
- scope is controlled
- results are easier to validate

---

## After Phase D

Only after success:

- expand routing scope
- evaluate full proxying
- explore payment rails

---

*This document is your mental guardrail when coding starts.*

---

*Last updated: 2025-12-14*
