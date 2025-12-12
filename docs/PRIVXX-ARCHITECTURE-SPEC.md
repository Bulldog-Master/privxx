# Privxx Architecture Specification (Detailed)

## 1. Purpose of This Document

This document defines the full technical architecture of Privxx, a privacy-first, post-quantum-secure browsing and payments tunnel.

This architecture supports:
- Metadata elimination
- Unlinkable routing
- Post-quantum security
- Strong anonymity guarantees
- Future integration with payments and other secure flows

This spec covers:
- MVP Phase 1 (simulated)
- MVP Phase 2 (real cMixx integration)
- Long-term durable architecture

---

## 2. System Overview

Privxx operates as a tunnel, not a browser:

```
[ Privxx Web/Mobile Client ]
          |
          |  xxDK + PQ Encryption
          v
[ cMixx Mixnet (xx Network) ]
          |
          v
[ Privxx Proxy Server ]
          |
          |  HTTPS (Phase 2+)
          v
[ External Website / Merchant / dApp ]
```

### Components

| Component | Description |
|-----------|-------------|
| **Privxx Client** | React/TypeScript UI that accepts URLs and displays proxied content |
| **xxDK** | XX Network SDK for cMixx routing and PQ key negotiation |
| **cMixx Mixnet** | Decentralized mixnet that shreds metadata via onion routing |
| **Privxx Proxy** | Backend server (Go/Rust) that receives requests from mixnet and fetches external content |
| **Target Website** | External destination the user wants to reach privately |

---

## 3. Phase 1 — Simulated Architecture (Current)

In Phase 1, **no real networking occurs**. The UI simulates:

- Connection initialization delay (2-3 seconds)
- PQ key negotiation status
- Mixnet routing status
- Simulated latency (500-2500ms)
- Placeholder content display

### Phase 1 Data Flow

```
User Input → Simulated Delay → Status Updates → Mock Content
```

### What Phase 1 Does NOT Do

- ❌ Real HTTP requests
- ❌ Real cMixx routing
- ❌ Real PQ encryption
- ❌ Real content proxying

---

## 4. Phase 2 — Real cMixx Integration

### 4.1 Client-Side Changes

The Privxx client will integrate **xxDK** to:
- Initialize cMixx client
- Negotiate PQ-safe keys
- Send requests through mixnet
- Receive responses via mixnet

### 4.2 Privxx Proxy Server

A dedicated backend (Go or Rust) will:
- Listen for mixnet messages
- Decrypt and validate requests
- Fetch external content via HTTPS
- Re-encrypt responses
- Send back through mixnet

### 4.3 Data Flow (Real)

```
[ Privxx Client ]
      |
      | xxDK: PQ-encrypted request
      v
[ cMixx Mixnet ]
      |
      | Unlinkable routing through 5+ nodes
      v
[ Exit Node ]
      |
      v
[ Privxx Proxy Server ]
      |
      | Standard HTTPS
      v
[ Target Website ]
      |
      | Response
      v
[ Privxx Proxy Server ]
      |
      | PQ-encrypted response
      v
[ cMixx Mixnet ]
      |
      v
[ Privxx Client ]
      |
      | Display content
      v
[ User ]
```

---

## 5. Security Architecture

### 5.1 Encryption Layers

| Layer | Protection |
|-------|------------|
| **Layer 1: PQ Encryption** | Client ↔ Mixnet entry node |
| **Layer 2: Onion Routing** | Each hop re-encrypts; no single node sees full path |
| **Layer 3: Exit Encryption** | Exit node ↔ Privxx Proxy |
| **Layer 4: TLS** | Privxx Proxy ↔ Target website |

### 5.2 Metadata Protection

| Metadata Type | Protection Method |
|---------------|-------------------|
| IP Address | Hidden by cMixx routing |
| Timing | Destroyed by mixnet batching |
| Request Size | Padded to uniform size |
| Device Fingerprint | No fingerprint collection |
| Session ID | Ephemeral, per-session only |

---

## 6. Technology Stack

### 6.1 Frontend (Privxx Client)

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tooling |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| react-i18next | Internationalization |

### 6.2 Backend (Privxx Proxy — Phase 2+)

| Technology | Purpose |
|------------|---------|
| Go or Rust | High-performance proxy server |
| xxDK | cMixx mixnet integration |
| TLS 1.3 | Secure external connections |

### 6.3 Infrastructure

| Component | Purpose |
|-----------|---------|
| xx Network | Decentralized mixnet |
| cMixx Protocol | Metadata-shredding routing |
| PQ KEMs | Post-quantum key exchange |

---

## 7. Privacy Constraints (Non-Negotiable)

These constraints apply to ALL phases:

1. **No analytics or tracking** — ever
2. **No cookies** — except ephemeral session tokens
3. **No localStorage** — for user data
4. **No persistent identifiers** — UUIDs, fingerprints, etc.
5. **No external HTTP requests** — in simulation mode
6. **All UI text** — must reinforce privacy messaging

---

## 8. Future Considerations

### 8.1 Payments Integration

Privxx will support privacy-preserving payments:
- Merchant checkout without tracking
- Wallet integration (post-quantum compatible)
- No payment correlation across sessions

### 8.2 Mobile Native

Native mobile clients (iOS/Android) will:
- Use native xxDK bindings
- Provide system-level privacy protection
- Integrate with secure enclaves

### 8.3 Browser Extension

A browser extension may:
- Intercept and route requests
- Provide one-click privacy mode
- Work alongside existing browsers

---

## 9. Compliance Targets

| Standard | Description |
|----------|-------------|
| **ISO 27001** | Information Security Management |
| **ISO 27701** | Privacy Information Management |
| **GDPR** | EU data protection (by design) |
| **CCPA** | California privacy compliance |

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial architecture spec |
| 1.1 | TBD | Phase 2 implementation details |
