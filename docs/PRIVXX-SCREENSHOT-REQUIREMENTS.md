# Privxx — Screenshot Requirements (Canonical)

---

## Purpose

Screenshots are authoritative artifacts used for:
- documentation
- demos
- presentations
- future development reference

**Incorrect screenshots cause design drift.**  
Only the screenshots defined here are valid.

---

## Required Screenshots (Must Have)

### 1. Home / Idle State (Primary)

**Filename:** `privxx-home-idle.png`

**Must show:**
- Privxx logo (correct styling, no white box)
- URL input field
- "Connect through Privxx" button (Idle background style)
- Status: Idle
- Full background visible

---

### 2. Connecting State

**Filename:** `privxx-connecting.png`

**Must show:**
- Same layout as Idle
- Status: Connecting…
- No color or layout changes

---

### 3. Secure State

**Filename:** `privxx-secure.png`

**Must show:**
- Status: Secure
- No dramatic visual change from Idle/Connecting
- Calm, stable appearance

---

### 4. Privacy Drawer Open

**Filename:** `privxx-privacy-drawer.png`

**Must show:**
- Privacy drawer fully open
- Human-readable privacy explanation
- Privxx name used consistently
- No overlapping UI elements

---

## Screenshot Rules (Non-Negotiable)

- Use the locked UI version only
- No mockups, no Figma exports
- Capture from the live app preview
- No cropping that removes context
- No dark mode variants unless explicitly approved
- No experimental UI states

---

## Storage Location

All approved screenshots must live in:

```
docs/screenshots/
```

---

## Validation Checklist

Before any screenshot is accepted:

- [ ] Privxx logo correct (gradient + teal mark, no white box)
- [ ] Background elements visible (spheres, gradient fog)
- [ ] All text readable (proper contrast)
- [ ] Correct connection state shown
- [ ] English language active
- [ ] Footer demo notice visible
- [ ] Filename matches specification exactly

---

## Future Screenshots (Phase D)

When cMixx integration is live:

| Filename | Shows |
|----------|-------|
| `privxx-real-routing.png` | Connected state, no demo notice |

---

*Last updated: 2025-12-14*
