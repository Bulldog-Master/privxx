# Privxx Phase-2 — Intent Flow Diagram

**Purpose:** User-friendly explanation of how Privxx handles actions privately.

---

## Visual Flow

```mermaid
flowchart TD
    USER[User Action<br/><i>Browse, Message, Pay</i>]
    INTENT[Intent Created<br/><i>Message / Payment</i>]
    POLICY[Policy Check<br/><i>Silent</i>]
    DECISION{Allowed?}
    EXECUTE[Bridge Executes<br/><i>Server-Side</i>]
    RESULT[Result Returned<br/><i>Sanitized</i>]

    USER --> INTENT
    INTENT --> POLICY
    POLICY --> DECISION

    DECISION -->|Yes| EXECUTE
    DECISION -->|No| RESULT

    EXECUTE --> RESULT

    style USER fill:#0f172a,color:#fff
    style INTENT fill:#334155,color:#fff
    style POLICY fill:#0d9488,color:#fff
    style DECISION fill:#e5e7eb,color:#000
    style EXECUTE fill:#6366f1,color:#fff
    style RESULT fill:#22c55e,color:#fff
```

---

## How It Works

| Step | What Happens | Privacy Benefit |
|------|--------------|-----------------|
| **1. User Action** | User browses, messages, or initiates payment | Action stays local |
| **2. Intent Created** | App creates an intent, not a network request | No metadata leaks |
| **3. Policy Check** | Silent evaluation of context and signals | User isn't tracked |
| **4. Decision** | Allow, warn, or deny based on policy | Privacy-first defaults |
| **5. Bridge Executes** | Server-side execution through cMixx | IP/timing hidden |
| **6. Result Returned** | Browser receives sanitized response only | No provider exposure |

---

## Key Promise

> **The browser never becomes the network actor.**

Your browser expresses *intent*. The Bridge *executes*. This separation ensures:

- Your IP address is never exposed to destinations
- Payment providers never see your browser fingerprint
- Timing correlation is broken by mixnet routing
- No persistent identifiers are created

---

## Where This Diagram Applies

| Location | Use Case |
|----------|----------|
| `/about` | Explain privacy architecture |
| `/how-it-works` | Onboarding flow |
| Investor deck | Technical differentiator |
| Documentation | Architecture reference |
| Demo script | Visual explanation |

---

## Current Status

| Phase | Intent Flow | Policy Engine | Bridge Execution |
|-------|-------------|---------------|------------------|
| Phase 1 | ❌ | ❌ | ✅ (cMixx messaging) |
| Phase 2 | ✅ Scaffolded | ✅ Stub (always allow) | ✅ Ready |
| Phase 3 | ✅ | ✅ Enforced | ✅ Payments enabled |

---

## Related Documents

- [Phase-2 Architecture](./PRIVXX-PHASE2-ARCHITECTURE.md)
- [Architecture Spec](./PRIVXX-ARCHITECTURE-SPEC.md)
- [Privacy Laws](./PRIVXX-PRIVACY-LAWS.md)

---

**Document Status:** Complete  
**Last Updated:** December 2025
