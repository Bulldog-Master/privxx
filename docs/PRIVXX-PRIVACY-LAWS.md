# Privxx Privacy Laws

**Foundational Doctrine for Privxx's Privacy Architecture**

Privxx exists for a single purpose:

> To eliminate metadata exposure and ensure post-quantum-safe, privacy-preserving browsing and payments.

These laws govern every product decision, UI element, technical design, and future backend implementation.

They make Privxx a **privacy engine**, not a browser, proxy, or VPN.

---

## Law 1 — Privacy Is the Default State

Privxx must always start in its maximum privacy mode.
Privacy cannot be something the user toggles on or off.

There is:
- No "Enable privacy" switch
- No degraded mode
- No analytics
- No telemetry
- No fingerprinting

Every session begins private, stays private, and ends private.

---

## Law 2 — Metadata Must Be Minimized, Obfuscated, or Destroyed

Privxx treats metadata as sensitive as content.

Privxx must protect users against exposure of:

### Network Metadata
- IP address
- Geolocation
- ISP identity
- DNS queries
- TLS fingerprinting
- Network timing patterns
- Packet size correlations

### Device Metadata
- Operating system
- Browser type
- Hardware IDs
- Screen resolution
- GPU fingerprint
- Installed fonts/plugins
- Any stable client-side fingerprint

### Behavioral Metadata
- Time of access
- Frequency
- Navigation paths
- Login patterns
- Purchase behavior

**If Privxx cannot eliminate metadata, it must break linkability.**

---

## Law 3 — All Privxx-Controlled Links Must Use Post-Quantum Cryptography

Where Privxx controls the transport, it must use:
- PQ-safe KEMs
- Hybrid PQ + classical modes (if required by xxDK)
- No RSA
- No classical ECDSA-only
- No outdated cipher suites

Privxx must resist **harvest-now, decrypt-later** attacks.

Even if target websites are not PQ-ready, Privxx's internal relays MUST be PQ-secure.

---

## Law 4 — No Persistent Identifiers

Privxx must not generate or expose:
- UUIDs
- Passwords
- Device IDs
- Browser IDs
- Analytics IDs
- Fingerprints
- Session IDs that survive beyond a single session

Every session is unlinkable from every other.

If a feature tries to create correlatable data, the feature is rejected or redesigned.

---

## Law 5 — No Trust in Intermediaries

Privxx must not rely on:
- Trusted server operators
- Trusted proxies
- Trusted third-party infra
- "Do not log" promises
- Privacy policies
- NDAs

**Privacy must come from math, not trust.**

Privxx uses:
- Unlinkable routing (cMixx)
- PQ cryptography
- Cryptographic unlinkability
- One-shot metadata-free requests

Intermediaries must be blind and powerless.

---

## Law 6 — Zero Retention

Privxx must not store:
- Browsing history
- Cookies
- Session data
- Autofill
- Query strings
- IP logs
- Access logs
- Cache data
- Device fingerprints

If the system requires temporary data (e.g., in-memory session keys), they must be:
- Ephemeral
- Non-persisted
- Unlinkable
- Destroyed upon session end

**Nothing privileged survives a session.**

---

## Law 7 — Transparency Over Obscurity

Privxx must clearly communicate:
- That this phase is simulated
- What is private now
- What will be private later
- How real mixnet integration works (in future docs)

There must be no false sense of security, especially during early MVP simulations.

---

## Law 8 — Progressive Privacy, Not Complexity

Privxx begins simple:
- A URL input
- A connect button
- A status indicator
- Privacy drawer with laws

Complexity is added after privacy, not before it.

---

## Law 9 — Future Features Must Pass Privacy Constraints First

Before adding any future capabilities (real payments, merchant checkout, login behavior, wallet enhancements), the feature must satisfy:

### The Privxx Privacy Compatibility Test:
- Does this introduce new metadata?
- Does this create correlatable identifiers?
- Does this reduce anonymity?
- Does this weaken PQ security?
- Can this be redesigned to avoid exposure?

If the answer is "Yes to exposure," the feature is rejected.

---

## Law 10 — Privxx Must Always Be User-Aligned

Privxx cannot:
- Sell user data
- Monetize behavior
- Run analytics
- Track engagement
- Create profiles
- Log usage

**The user is the product owner, not the product.**

Privxx's entire mission is aligned with the individual's privacy and security.

---

## Conclusion

These laws make Privxx fundamentally different from:
- Browsers
- VPNs
- Tor
- Privacy wrappers
- VPN-over-Tor hybrids
- Proxy anonymizers

Privxx is a **post-quantum-ready privacy tunnel**, driven by mixnets, built for payments, and designed for metadata elimination.

These laws guide every architectural and UI decision today and in the future.
