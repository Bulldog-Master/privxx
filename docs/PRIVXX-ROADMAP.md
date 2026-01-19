# Privxx Roadmap (Full Project Timeline)

Privxx is structured into six phases, moving from simulation → hardened backend → full private messaging/payments functionality.

---

## PHASE 0 — Foundation ✅ LOCKED

**Status:** ✅ Complete

### Deliverables

- UI Shell (React + Lovable)
- Status states: Idle → Connecting → Connected
- PWA install support
- 16-language i18n support
- Bridge-only architecture lock
- Diagnostics foundation
- Privacy Laws document
- Architecture Spec

---

## PHASE 1 — Demo Messaging ✅ LOCKED

**Status:** ✅ Complete

### Deliverables

- Identity create/unlock/lock UX
- Inbox polling and deduplication
- Compose panel with send-to-self roundtrip
- Demo script and diagnostics copy

---

## PHASE 2 — Intent + Policy ✅ LOCKED

**Status:** ✅ Complete

### Deliverables

- Browser anomaly signals (diagnostic only)
- Policy engine stub (allow-all)
- Payment intent abstraction stub
- Documentation and diagrams

---

## PHASE 3 — Messaging Design ✅ LOCKED

**Status:** ✅ Complete

### Deliverables

- Frontend orchestration locked
- Conversation derivation from inbox/thread queues
- Auth-gated inbox polling with tab-visibility
- Preview fetching (N+1 safe, lazy loading)
- Thread view behavior (visibility-gated)
- Nicknames (frontend-only, localStorage)

### Semantic Guardrails

- ❌ No read receipts
- ❌ No presence/typing indicators
- ❌ No frontend decryption
- ✅ Phase-1 contract preserved

---

## PHASE 4 — Backend Hardening ✅ LOCKED

**Status:** ✅ Complete (2026-01-19)

### Architecture

```
Frontend (Lovable) → Bridge (public :8090) → Backend Core (localhost :8091)
```

### Key Guarantees

- Frontend ONLY talks to Bridge (same-origin: https://privxx.app)
- Backend Core is NOT internet-facing (127.0.0.1:8091 only)
- Bridge does NOT expose backend-only routes

### Deliverables

- Bridge /health endpoint hardened
- Backend Core /health with capabilities
- Cache-Control: no-store on health responses
- /xxdk/* and /cmixx/* return 404 by design

### Lock Rules

- No edits to /health handlers
- No bridge route expansion
- No backend exposure
- All changes require Phase 5 branch

---

## PHASE 5 — Messaging + Tunnel Enablement 📋 NEXT

**Status:** ⚪ Planned

### Goals

- Enable messaging on hardened foundation
- Activate tunnel capability
- Implement decryption in Backend Core
- Capability-gated feature rollout

### Tasks

- [ ] Messaging endpoints enabled
- [ ] Tunnel routing enabled
- [ ] Backend Core decryption implemented
- [ ] Frontend unchanged (already compatible)

---

## PHASE 6 — Native Mobile Apps 📋 FUTURE

**Status:** ⚪ Planned

- Capacitor or native Swift/Kotlin
- Local secure enclave wallet
- Push notifications (privacy-preserving)
- Private QR payments
- PWA polish for app store readiness

---

## PHASE 7 — Commercialization Options 📋 FUTURE

**Status:** ⚪ Planned

- Freemium + Premium private rails
- B2B: Privacy-as-a-service for merchants
- SDK for 3rd-party payment apps
- Browser extension (privacy injector)

---

## ONGOING

Privacy-critical maintenance:

- PQ crypto updates
- Mixnet routing improvements
- Zero-logging audits
- Threat model revisions
- Performance tuning

---

## Non-Negotiable Principles

Every phase must adhere to the [Privxx Privacy Laws](./PRIVXX-PRIVACY-LAWS.md):

1. Privacy is default
2. Metadata minimized, obfuscated, or destroyed
3. Post-quantum cryptography on all Privxx-controlled links
4. No persistent identifiers
5. No trust in intermediaries
6. Zero retention
7. Transparency over obscurity
8. Progressive privacy, not complexity
9. Privacy compatibility test for all features
10. User-aligned — never monetize behavior

---

## Contributing

Privxx welcomes privacy-focused contributors. Before building:

1. Read the [Privacy Laws](./PRIVXX-PRIVACY-LAWS.md)
2. Understand the [Architecture](./PRIVXX-ARCHITECTURE-SPEC.md)
3. Review the current phase requirements
4. Propose changes that pass the privacy compatibility test

---

## Contact

For questions about the Privxx roadmap or contribution opportunities, reach out to the project maintainers.
