# Privxx Phase 2 – Dev Brief (Backend + Real Tunnel)

> **Note:** Visual and UX decisions are governed by [brand-ui-lock.md](brand-ui-lock.md).

## Goal

Turn the current **simulated** Privxx prototype into a **real** privacy tunnel for HTTP(S) using:

- xxDK (client + server)
- cMixx (xx Network mixnet)
- A small Privxx Proxy server

## Minimal Milestone

1. From the Privxx UI, send a real HTTP GET for a given URL.
2. Route it via cMixx to a Privxx Proxy.
3. Proxy does a real HTTPS request to the target site.
4. Response goes back via cMixx.
5. UI shows the real response status + a simple confirmation.

We do **not** need full page rendering in Phase 2 — just a proof that the tunnel works end-to-end.

---

## Components

### 1. Privxx Client (front-end)

- Already built (React).
- Needs a small bridge to:
  - Call a local xxDK client (WebAssembly or native wrapper).
  - Wrap URL + headers into the request envelope.

### 2. Privxx Proxy (backend)

- **Language**: Go or Rust (or Node if faster to implement).
- **Responsibilities**:
  - Run xxDK client.
  - Receive decrypted `http_request` messages.
  - Perform outbound HTTPS.
  - Return `http_response` messages.

### 3. Message format

- As defined in `backend/privxx-proxy-spec.md` and `docs/PRIVXX-ARCHITECTURE-SPEC.md`.

---

## Constraints

- No logging of full URLs or bodies.
- No analytics or tracking.
- Minimal headers to target websites.
- PQ-safe or hybrid crypto whenever xxDK allows it.

---

## Success Criteria

- [ ] One or more test URLs can be fetched **through cMixx** using Privxx.
- [ ] Round-trip latency can be measured.
- [ ] No user IP is exposed to the target site (only the proxy's IP).

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                             │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Privxx UI      │───▶│  xxDK Client    │                     │
│  │  (React)        │    │  (WASM/Native)  │                     │
│  └─────────────────┘    └────────┬────────┘                     │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   │ PQ-encrypted via cMixx
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      XX NETWORK (cMixx)                         │
│                                                                 │
│   Mix Node → Mix Node → Mix Node → Mix Node → Gateway           │
│                                                                 │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PRIVXX PROXY SERVER                       │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  xxDK Server    │───▶│  HTTP Forwarder │                     │
│  │  (Listener)     │    │  (HTTPS out)    │                     │
│  └─────────────────┘    └────────┬────────┘                     │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   │ Standard HTTPS
                                   ▼
                    ┌──────────────────────────┐
                    │   TARGET WEBSITE         │
                    │   (Bank / Merchant / dApp)│
                    └──────────────────────────┘
```

---

## Development Phases

### Phase 2a: Local Proof-of-Concept

1. Set up xxDK client in test mode
2. Create minimal Privxx Proxy with hardcoded test endpoints
3. Verify message round-trip works

### Phase 2b: Real Network Integration

1. Connect to live xx Network testnet
2. Deploy Privxx Proxy to cloud server
3. Measure real-world latency

### Phase 2c: UI Integration

1. Wire React UI to xxDK bridge
2. Replace simulation logic with real tunnel calls
3. Handle connection states and errors

---

## Timeline Estimate

| Phase | Duration | Outcome |
|-------|----------|---------|
| 2a | 1–2 weeks | Local tunnel works |
| 2b | 1–2 weeks | Testnet integration |
| 2c | 1 week | UI wired to real backend |
| **Total** | **3–5 weeks** | End-to-end working tunnel |

---

## References

- `backend/privxx-proxy-spec.md` — Message format specification
- `docs/PRIVXX-ARCHITECTURE-SPEC.md` — Full architecture details
- `docs/PRIVXX-VISION.md` — Product vision and privacy principles
- `docs/PRIVXX-PRIVACY-LAWS.md` — Ten Privacy Laws governing all decisions
