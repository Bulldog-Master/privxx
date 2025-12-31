# Architecture Overview

## Locked model

```
Client (Browser/App)
→ Proxy (Public)
→ Bridge (Local security boundary)
→ xxDK / cMixx
```

## Why this matters

- Browser compromise ≠ identity compromise
- Bridge can enforce auth, rate limits, TTL unlock, and logging rules
- Diagnostics can show "where it broke" without exposing topology

## Key principles

1. **Frontend never calls backend directly** — All requests go through Bridge
2. **Bridge is the only HTTP surface** — Backend is localhost-only
3. **Session-based identity** — Unlock TTL prevents persistent exposure
4. **Same-origin proxy** — Production uses reverse proxy for CORS/security
