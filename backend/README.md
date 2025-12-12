# Privxx Backend (Future)

This directory is reserved for the **Privxx Proxy** backend implementation.

---

## Planned Components

### Privxx Proxy Server
- **Language**: Go or Rust (TBD)
- **Purpose**: 
  - Receive HTTP-like requests over cMixx
  - Forward to target websites via HTTPS
  - Return responses through cMixx tunnel

### xxDK Integration
- cMixx client library bindings
- Post-quantum key negotiation
- Mixnet message handling

---

## Current Status

🚧 **Not implemented yet** – This is Phase 2+ work.

The frontend UI shell (in `src/`) currently uses simulated behavior only.

---

## When This Gets Built

1. Prototype Privxx Proxy in isolated environment
2. Test xxDK/cMixx integration separately
3. Wire real backend to the UI shell
4. Replace simulated latency with actual mixnet timing

---

## Privacy Requirements

Any backend code must follow Privxx privacy principles:

- No logging of user requests or destinations
- No persistent session identifiers
- No analytics or tracking
- Post-quantum-safe cryptography for all Privxx-controlled links
- Zero retention of browsing data
