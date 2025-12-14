# Privxx Versioning Rules

## Purpose
This document defines how Privxx versions are assigned
to prevent confusion during integration and demo phases.

---

## Version Format
Privxx uses the following format:

MAJOR.MINOR.PATCH

Example: 0.2.0

---

## Pre-1.0 Rules (Current Phase)
Before version 1.0.0:

- MAJOR (0 → 1)  
  Reserved for production readiness.

- MINOR (0.x → 0.y)  
  Used when:
  - a new phase is completed
  - core behavior changes (e.g., simulated → real cMixx events)

- PATCH (0.x.z)  
  Used for:
  - documentation fixes
  - internal refactors
  - logging improvements
  - non-user-visible changes

---

## Phase Mapping

### 0.1.0
- Locked UI
- Simulated routing
- Demo-ready prototype

### 0.2.0 (Target: Phase D)
- Real cMixx control-channel integration
- Secure state triggered by real events
- UI unchanged

### 0.3.0+
- Expanded routing scope
- Reliability and performance work

---

## Hard Rule
If the user can *see* the difference, it requires:
- a MINOR version bump
- documentation updates
- screenshot re-verification

---

## Enforcement
Versioning decisions must respect:
1. `brand-ui-lock.md`
2. `PRIVXX-DESIGN-CONSTITUTION.md`
3. `PRIVXX-WHAT-CHANGES-WHAT-DOESNT.md`
