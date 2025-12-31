# Privxx Documentation

Privxx is a privacy-first client architecture built around one non-negotiable rule:

> **The browser never holds cryptographic identity or network state.**  
> All sensitive operations occur behind the **Bridge** security boundary.

---

## What you can do here

- Understand the **architecture layers** (Client → Proxy → Bridge → xxDK/cMixx)
- Review the **API contract** (OpenAPI)
- Run a **60-second live demo** using the demo script
- Track progress via the **Phase roadmap**

---

## Quick links

- **Architecture Overview** → `Architecture → Overview`
- **API Contract** → `Architecture → API Contract`
- **Phase 2** → `Architecture → Phase 2`
- **Demo Script** → `Runbooks → Demo Script`

---

## Status at a glance

✅ Frontend is built to be backend-agnostic  
✅ Diagnostics explain failures without leaking infrastructure  
✅ OpenAPI contract defines Bridge endpoints  
⏳ Backend stabilization + production routing in progress (separate track)

---

## Principles

- Minimal metadata leakage
- No tracking by default
- Same-origin proxy architecture
- Clean API boundaries
- Session-based identity unlock
