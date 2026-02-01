# PRIVXX — BUILD BASELINE (AUTHORITATIVE)

Phase: 6 (Locked)
Date: 2026-02-01

## Canonical Architecture (Option A)
- Frontend: Supabase-authenticated Web App
- Bridge: Authenticated API surface (JWT-gated)
- Backend: Real xxDK + cMixx (private, local-only)
- No xxDK material exposed to browser

## Security Properties
- Metadata-resistant (cMixx)
- Quantum-resistant (xxDK)
- Backend identity never leaves server
- Bridge health reflects backend readiness

## Locked Components
- privxx-bridge (v0.4.0)
- privxx-backend (xxDK real)
- Supabase JWT verification
- Phase D connect_intent schema

Any deviation requires a new phase.
