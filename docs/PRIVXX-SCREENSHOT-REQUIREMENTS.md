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

**What it must show:**
- Full viewport
- Privxx hero logo (gradient "Priv" + teal xx mark)
- Tagline: "Private Browsing & Payments Tunnel"
- URL input field (empty, with globe icon)
- "Connect through Privxx" button (idle state)
- Status bar showing "Idle"
- Background: deep blue base, teal spheres, gradient fog at bottom
- Footer: "Demo mode — routing simulated"

**What must NOT appear:**
- Browser chrome
- Dev tools
- Cursor
- Any non-English language

---

### 2. Connecting State

**Filename:** `privxx-connecting.png`

**What it must show:**
- URL field with example URL entered (e.g., `https://my-bank.example.com`)
- Button text: "Connecting through Privxx"
- Status bar: "Connecting…" with pulse animation
- Subtle animation state captured (pulse visible)

---

### 3. Secure / Connected State

**Filename:** `privxx-secure.png`

**What it must show:**
- Button text: "Connected"
- Status bar: "Secure" with green indicator dot
- Green dot has subtle glow/shadow
- Same URL still visible in input field

---

### 4. Privacy Drawer Open

**Filename:** `privxx-privacy-drawer.png`

**What it must show:**
- Drawer slid in from right
- Header: "How Privxx protects you"
- All four sections visible:
  - Private browsing, by design
  - Private payments
  - What we don't see
  - Current status
- Background slightly visible behind drawer

---

### 5. Language Dropdown Open

**Filename:** `privxx-language-dropdown.png`

**What it must show:**
- Globe icon in header (clicked/active)
- Dropdown menu open
- English at top (pinned)
- Divider below English
- Remaining languages alphabetically sorted
- At least 5-6 languages visible in dropdown

---

### 6. Footer Close-Up (Optional)

**Filename:** `privxx-footer-detail.png`

**What it must show:**
- Footer text: "Demo mode — routing simulated"
- Clear, readable against background
- Cropped to show just bottom portion of screen

---

## Screenshot Specifications

| Property | Requirement |
|----------|-------------|
| Format | PNG (lossless) |
| Viewport | 1280×800 minimum |
| Browser | Chrome or Safari, incognito |
| Zoom | 100% |
| Language | English |
| DevTools | Closed |
| Cursor | Hidden |

---

## File Location

All screenshots saved to:

```
docs/screenshots/
├── privxx-home-idle.png
├── privxx-connecting.png
├── privxx-secure.png
├── privxx-privacy-drawer.png
├── privxx-language-dropdown.png
└── privxx-footer-detail.png (optional)
```

---

## Validation Checklist

Before any screenshot is accepted:

- [ ] Privxx logo correct (gradient + teal mark, no white box)
- [ ] Background elements visible (spheres, gradient fog)
- [ ] All text readable (proper contrast)
- [ ] Correct connection state shown
- [ ] English language active
- [ ] No browser UI, dev tools, or cursor
- [ ] Footer demo notice visible (full-page shots)
- [ ] Filename matches specification exactly

---

## Do Not Capture

- ❌ Partial states or transitions mid-animation
- ❌ Non-English UI
- ❌ Editor/Lovable interface
- ❌ Mobile viewport (save for separate mobile spec)
- ❌ Any state not defined above

---

## Future Screenshots (Phase D)

When cMixx integration is live:

| Filename | Shows |
|----------|-------|
| `privxx-real-routing.png` | Connected state, no demo notice |
| `privxx-cmixx-latency.png` | Real latency metrics displayed |

---

*Last updated: 2025-12-14*
