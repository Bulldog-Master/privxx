# Phase 2

Phase 2 added **Intent + Policy** (no enforcement initially).

**Status:** ✅ LOCKED

## Components

### Browser Anomaly Signals

Diagnostic signals collected from the browser environment:

- Timezone consistency
- Language detection
- WebGL fingerprint variance
- Canvas fingerprint variance

These are **diagnostic only** — no blocking decisions in Phase 2.

### Policy Engine Stub

A placeholder policy engine that:

- Accepts all requests (allow-all)
- Logs policy decisions for debugging
- Prepares for Phase 3 enforcement

### Payment Intent Abstraction

A stub for payment intents that:

- Captures user intent (purchase, subscription)
- Does not perform real network requests
- Logs intents locally for debugging

## Phase 2 Goals

1. ✅ Establish intent/policy architecture
2. ✅ Add diagnostic signals
3. ✅ Create stubs for future enforcement
4. ✅ Document decision flow

## What's NOT in Phase 2

- Real payment processing
- Policy enforcement (warn/reauth/deny)
- Rate limiting enforcement

## Next Phase

Phase 2 is complete. See [Phase 3](./phase-3.md) for Messaging Design and [Phase 4](./phase-4.md) for Backend Hardening.
