# Privxx Roadmap (Full Project Timeline)

Privxx is structured into five phases, moving from simulation → real mixnet integration → full private payments functionality.

---

## PHASE 1 — Simulation Prototype (NOW)

**Status:** ✅ Completed / Under refinement

### Goals

- Validate product concept
- Validate UI/UX
- Enable demos and internal review
- Avoid unnecessary backend development until validated

### Deliverables (Complete)

- UI Shell (React + Lovable)
- Status states: Idle → Connecting → Connected (simulated)
- Simulated latency (500–2500 ms)
- URL echo + placeholder for proxied content
- Privacy Laws document
- Architecture Spec
- Visual Walkthrough
- Backend folder + specs for future integration
- Multi-language support structure (i18n)

### Future Enhancements

- More realistic simulated responses
- Fake merchant checkout simulation
- Simulated "privacy score" or metadata breakdown

---

## PHASE 2 — Real Mixnet Integration (cMixx + xxDK)

**Status:** 🔵 Not started

### Overview

Privxx transitions from UI simulation to a real, privacy-preserving network layer using cMixx.

### Tasks

#### 2.1 Privxx Client Integration

- Integrate xxDK WebAssembly/native bindings
- Generate PQ-safe ephemeral keypairs
- Encode/Encrypt outbound requests
- Decrypt inbound responses
- Implement request/response envelope formats

#### 2.2 Privxx Proxy (Backend)

- Implement xxDK client in backend
- Decrypt requests received via cMixx
- Forward HTTPS requests
- Sanitize headers
- Remove identifiers
- Repackage responses
- Enforce zero-logging guarantees

#### 2.3 Security Testing

- Metadata leak testing
- Timing analysis
- Traffic correlation testing
- Endpoint sanitization review

### Milestones

- [ ] First real cMixx-routed request
- [ ] First real website rendered inside Privxx
- [ ] Reproducible clean anonymous browsing flow

---

## PHASE 3 — Private Payments (Optional Advanced Phase)

**Status:** ⚪ Future

Once private browsing is stable, Privxx extends into private financial flows, including:

### 3.1 Private Checkout Flow

- Merchant checkout through Privxx
- Bank/E-transfer tunnels
- xx Coin payments
- Multi-rail privacy abstraction layer

### 3.2 Private Wallet Module

- Local secure-element keys
- xx coin + optional EVM wallet
- Proxxy-style RPC privacy
- Onboard-without-KYC flows
- Transaction metadata elimination

### 3.3 Private Identity Layer (Optional)

- Zero-knowledge login tokens
- Anonymous merchant tokens
- Private receipts

---

## PHASE 4 — Native Mobile Apps

**Status:** ⚪ Future

- Capacitor or native Swift/Kotlin
- Local secure enclave wallet
- Push notifications (privacy-preserving)
- Private QR payments

---

## PHASE 5 — Commercialization Options

**Status:** ⚪ Future

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
