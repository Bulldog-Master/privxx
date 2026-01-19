PHASE 4 — HARDENING — LOCKED

Applies to:
- backend/core
- backend/bridge

Commits:
- 3d09cb5
- 4fc19ca

Rules:
- No edits to /health handlers
- No bridge route expansion
- No backend exposure
- All changes require Phase 5 branch

Build box state is authoritative for PROD.
