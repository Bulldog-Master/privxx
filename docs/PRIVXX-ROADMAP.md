# Privxx Roadmap

**A phased approach to building a privacy-first, post-quantum-secure browsing and payments tunnel.**

---

## Overview

Privxx development follows a structured, privacy-first progression:

| Phase | Name | Status | Focus |
|-------|------|--------|-------|
| 1 | Simulated Prototype | 🟢 Active | UI shell, UX validation, documentation |
| 2 | Real cMixx Integration | 🔵 Planned | xxDK client, Privxx Proxy, real mixnet routing |
| 3 | Payments & Extensions | ⚪ Future | Privacy-preserving payments, mobile apps, wallet integration |

---

## Phase 1 — Simulated Prototype

**Status:** 🟢 Active (Current)

**Goal:** Validate the Privxx concept, UX, and architecture before investing in backend development.

### Completed

- [x] Privxx UI shell (React + Vite + Tailwind)
- [x] Simulated connection flow with realistic delays
- [x] Privacy drawer with Privxx Privacy Laws
- [x] Dark theme, privacy-first aesthetic
- [x] Project documentation (README, Architecture, Privacy Laws)
- [x] GitHub repository with proper structure
- [x] Multi-language support structure (i18n)

### In Progress

- [ ] Refine UI copy to match privacy messaging
- [ ] Add connection status animations
- [ ] Improve mobile responsiveness

### Remaining

- [ ] Demo script for stakeholder presentations
- [ ] Landing page explaining Privxx value proposition
- [ ] User testing with privacy-conscious audience

---

## Phase 2 — Real cMixx Integration

**Status:** 🔵 Planned

**Goal:** Replace simulated behavior with real cMixx mixnet routing and Privxx Proxy.

### Prerequisites

- Phase 1 UI finalized
- xxDK bindings tested in isolation
- Privxx Proxy prototype working standalone

### Deliverables

- [ ] xxDK client integration (Go or Rust)
- [ ] Privxx Proxy server implementation
- [ ] Real cMixx message routing
- [ ] Post-quantum key negotiation
- [ ] End-to-end encrypted request/response flow
- [ ] Connection status reflecting real mixnet state
- [ ] Latency display from actual routing

### Architecture

```
[ Privxx App (React) ]
        |
        | xxDK + PQ Encryption
        v
[ cMixx Mixnet (xx network) ]
        |
        v
[ Privxx Proxy Server ]
        |
        | HTTPS
        v
[ Target Website ]
```

### Privacy Requirements

- No logging on Privxx Proxy
- No persistent session identifiers
- Minimal HTTP headers
- Zero retention of request data

---

## Phase 3 — Payments & Extensions

**Status:** ⚪ Future

**Goal:** Extend Privxx to privacy-preserving payments and additional platforms.

### Potential Features

- [ ] Privacy-preserving payment flows
- [ ] Merchant checkout integration
- [ ] Mobile applications (iOS, Android shells)
- [ ] Desktop application (Electron or native)
- [ ] xx Network wallet integration
- [ ] Browser extension

### Research Areas

- Payment metadata protection
- Merchant-side integration patterns
- Cross-platform mixnet clients
- Hardware wallet support

---

## Non-Negotiable Principles

Every phase must adhere to the Privxx Privacy Laws:

1. **Privacy is default** — No opt-in required
2. **Metadata minimized** — Obfuscate or destroy
3. **Post-quantum cryptography** — On all Privxx-controlled links
4. **No persistent identifiers** — Sessions are unlinkable
5. **No trust in intermediaries** — Privacy from math, not promises
6. **Zero retention** — Nothing survives a session
7. **Transparency** — Clear about simulation vs. real phases
8. **Progressive privacy** — Simple first, complex later
9. **Privacy compatibility test** — All features must pass
10. **User-aligned** — Never monetize behavior or data

See: [PRIVXX-PRIVACY-LAWS.md](./PRIVXX-PRIVACY-LAWS.md)

---

## Contributing

Privxx welcomes privacy-focused contributors. Before building:

1. Read the [Privacy Laws](./PRIVXX-PRIVACY-LAWS.md)
2. Understand the [Architecture](./PRIVXX-ARCHITECTURE-SPEC.md)
3. Review the current phase requirements
4. Propose changes that pass the privacy compatibility test

---

## Timeline

| Milestone | Target |
|-----------|--------|
| Phase 1 Complete | Q1 2025 |
| Phase 2 Prototype | Q2-Q3 2025 |
| Phase 2 Production | Q4 2025 |
| Phase 3 Planning | 2026 |

*Timelines are estimates and may shift based on xx Network ecosystem development.*

---

## Contact

For questions about the Privxx roadmap or contribution opportunities, reach out to the project maintainers.
