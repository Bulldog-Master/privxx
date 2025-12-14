# Privxx Design Constitution

**Version 1.0 — Ratified & Locked**

---

## Authority

This document is the single source of truth for Privxx visual identity and UI design.

All implementations — demos, prototypes, integrations, contributor PRs, AI-generated code — must conform to this constitution.

No exceptions without explicit versioned approval.

---

## Core Identity

**Privxx = Privacy + Payments**

The UI must communicate:
- Safety without fear
- Confidence without aggression
- Clarity without sterility
- Momentum without chaos

---

## The Privxx Logo (Non-Negotiable)

| Element | Rule |
|---------|------|
| **"Priv"** | Gradient text (pink → gold → teal) |
| **"xx"** | Official xx Network logo mark, teal color |
| **Spacing** | Tight kerning: sm=-0.2em, md=-0.25em, lg=-0.3em |
| **Context** | Used everywhere the brand appears in UI |

**Never:**
- Plain text "Privxx"
- Different colors or fonts
- Text-only fallbacks
- White/light boxes behind the mark
- Emoji or icon substitutes

---

## Visual Language

| Principle | Implementation |
|-----------|----------------|
| **Glassmorphism** | Translucent cards, buttons, controls |
| **Layered depth** | Gradient background with circular forms |
| **Warm-to-teal** | Color flows from pink/gold to teal/cyan |
| **No solid fills** | CTAs use glass style, not competing blocks |
| **Global neutrality** | No regional, cultural, or demographic imagery |

---

## Permitted Changes

✅ Functional behavior  
✅ Accessibility improvements  
✅ Performance optimization  
✅ Bug fixes  

---

## Prohibited Changes

❌ Color palette modifications  
❌ Logo redesigns or reinterpretations  
❌ Background style changes  
❌ Button opacity or gradient changes  
❌ "Simplifications" or "cleanups"  
❌ AI-suggested visual improvements  

---

## Enforcement

Before merging any UI change:

1. Does it match `docs/brand-ui-lock.md`?
2. Is the Privxx logo rendered correctly?
3. Are glass/translucency styles preserved?
4. Does it feel: safe, confident, clear, premium?

**If any answer is NO → reject the change.**

---

## Reference

Full specifications: [`docs/brand-ui-lock.md`](brand-ui-lock.md)

---

*This constitution protects Privxx from design drift, scope creep, and well-meaning "improvements" that erode brand coherence.*
