# Privxx — Phase 6 Cheat Sheet (LOCKED)

## Phase Name
Phase 6 — Real xxDK & cMixx Readiness (Server-Owned Identity)

## Architecture (FINAL)
Option A:
- Supabase auth (frontend)
- Bridge validates JWT
- Backend owns xxDK + cMixx identity
- Frontend NEVER sees xxDK keys or state

## VPS ROLES
privxx:
- PRODUCTION ONLY
- Runs:
  - privxx-bridge (127.0.0.1:8090)
  - privxx-backend (127.0.0.1:8091)
- No experiments

privxx-build:
- BUILD ONLY
- Compiles binaries
- Produces artifacts
- Never runs prod services

## Health Semantics
Backend:
- GET /health → xxdkReady = true (ground truth)

Bridge:
- GET /health → mirrors backend xxdkReady

Frontend:
- Read-only consumer
- No mock state

## Identity Model
- Supabase JWT
- Server-owned xxDK identity
- Time-limited unlock session
- No frontend key material

## Phase 6 HARD RULES
DO NOT:
- Change auth
- Rework identity
- Touch xxDK init
- Modify health semantics

Next Phase:
Phase 7 — Messaging & Payload Routing
