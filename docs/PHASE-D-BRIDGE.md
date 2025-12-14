# Phase D Bridge (UI-Locked → cMixx-Backed)

## Goal
Integrate real cMixx routing behind the existing Privxx interface **without changing the UI**.

This bridge defines what stays fixed (UI invariants) and what changes (backend behavior).

---

## UI Invariants (Must Not Change)
The following are locked by `docs/screenshots/*` and must remain unchanged:
- Layout, typography, spacing, and component shapes
- Background spheres + gradient haze style
- Top-left globe + Privacy controls placement
- Button/rows gradient treatment and translucency
- Copy tone and structure (status labels + subtext, privacy drawer sections)

If a change is needed, it must be explicitly approved and the canonical screenshots updated.

---

## Current Demo States (Phase C)
Current UI states:
- `idle` — "Idle / Ready to connect privately"
- `connecting` — "Connecting / Establishing private route"
- `connected` — "Secure / Private routing active"

Current behavior:
- Simulated routing only (UI + timing)
- No cryptographic routing enforced yet

---

## Phase D Target Behavior (cMixx-Backed)
### What becomes real
- Connection initiates real cMixx session setup
- Requests are routed through cMixx (or a controlled proxy/bridge that uses cMixx)
- Status reflects real handshake + connectivity outcomes
- Error states map to real failures

### What stays the same
- UI visuals remain locked
- Same interaction model (URL input → connect → status)

---

## State Mapping (Demo → Real)
- `idle`:
  - No active cMixx session
  - Ready to initiate
- `connecting`:
  - cMixx client init
  - session handshake / route establishment
  - (optional) DNS/endpoint resolution step
- `connected`:
  - session established
  - routing active
  - health checks passing

---

## Error/Recovery (Phase D)
Add non-invasive handling:
- Connection failure returns to `idle` with subtle message (no UI redesign)
- Timeout rules:
  - handshake timeout
  - route validation timeout
- Retry strategy:
  - single retry
  - then revert to idle

---

## Acceptance Criteria (Phase D)
- UI matches canonical screenshots (no drift)
- "Connect" triggers real cMixx-backed routing path
- `connecting` and `connected` reflect real state transitions
- Privacy drawer copy remains accurate (demo note can evolve when live)
