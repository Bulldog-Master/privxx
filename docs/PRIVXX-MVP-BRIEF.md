# Privxx MVP Brief

## What is Privxx?

Privxx is a **privacy-first tunnel for browsing and payments** using the xx network's cMixx mixnet technology. It hides IP, location, timing patterns, and device fingerprints using post-quantum-safe cryptography.

---

## Core Problem

When users browse websites or make payments online, they leak metadata:
- **IP address** → reveals location and identity
- **Timing patterns** → can be correlated across sessions
- **Device fingerprints** → persistent tracking without cookies
- **TLS metadata** → visible to ISPs and network observers

Even with HTTPS, adversaries can perform "harvest now, decrypt later" attacks using future quantum computers.

---

## Privxx Solution

Privxx routes all traffic through the **cMixx mixnet**, which:
- Breaks the link between user and destination
- Mixes traffic timing to prevent correlation
- Uses post-quantum-safe cryptography
- Provides privacy through mathematics, not trust

---

## Architecture

```text
[ User Device ]
      |
      | Privxx App (no tracking, no persistent IDs)
      v
[ xxDK Client ] ──── PQ-encrypted ────> [ cMixx Mixnet ]
                                              |
                                              v
                                    [ Privxx Proxy Server ]
                                              |
                                              | HTTPS
                                              v
                                    [ Target Website/Service ]
```

---

## Privacy Principles (Non-Negotiable)

1. **Privacy is default** – No "enable privacy" toggle
2. **Metadata minimization** – Minimize, obfuscate, or destroy
3. **Post-quantum cryptography** – All Privxx links use PQ-safe or hybrid crypto
4. **No persistent identifiers** – No analytics IDs, tracking IDs, or durable sessions
5. **No trust in intermediaries** – Privacy from crypto and mixnets, not promises
6. **Zero retention** – No browsing history, no tracking cookies

---

## Phase 1: Simulated Prototype (Current)

### Goals
- Express the product vision and UX
- Build the UI shell before backend complexity
- Validate the user experience

### What's Built
- Dark-themed React web app
- URL input field
- Simulated connection flow:
  - `Idle` → `Connecting through Privxx…` → `Connected (simulated)`
  - 2–3 second randomized delay
  - 500–2500ms simulated latency display
- Privacy drawer with core principles
- No external network requests
- No analytics, cookies, or tracking

### What's NOT Built Yet
- Real cMixx/xxDK integration
- Privxx Proxy backend
- Actual proxied content rendering

---

## Phase 2: Real Integration (Future)

### Planned Work
1. **Privxx Proxy Server**
   - Go or Rust implementation
   - Receives HTTP-like requests over cMixx
   - Forwards to target sites via HTTPS
   - Returns responses through cMixx

2. **xxDK Client Integration**
   - Integrate xxDK into the app
   - Real cMixx tunnel establishment
   - Post-quantum key negotiation

3. **Content Rendering**
   - Display proxied content in sandboxed frame
   - Handle various content types

---

## Compliance Targets

- **ISO 27001** – Information Security Management
- **ISO 27701** – Privacy Information Management

---

## Technical Constraints

- **No external HTTP requests** in Phase 1
- **No localStorage** for user data
- **No cookies or analytics**
- **All strings i18n-ready** for multi-language support
- **Dark theme default** (privacy aesthetic)

---

## Success Metrics (Phase 1)

- [ ] UI matches the Privxx vision
- [ ] Simulated connection feels realistic
- [ ] Privacy principles clearly communicated
- [ ] Codebase ready for real backend integration
- [ ] No privacy anti-patterns in code

---

## Next Steps

1. Complete i18n implementation for multi-language support
2. Add detailed connection steps (cMixx tunnel → PQ keys → routing)
3. Begin Privxx Proxy prototype in separate repo
4. Test xxDK integration in isolated environment
5. Wire real backend to UI shell
