# Privxx — Screenshot Requirements

**Purpose:** Define exactly what each screenshot must capture so visuals never drift from locked UI.  
**Location:** Save all screenshots to `docs/screenshots/`

---

## Screenshot Specifications

| # | Filename | What It Shows | Required Elements |
|---|----------|---------------|-------------------|
| 1 | `01-hero.png` | Full hero section at Idle state | Privxx logo (gradient text + teal xx mark), tagline, URL input field empty, Connect button visible, footer with demo notice |
| 2 | `02-input-field.png` | URL input with example text | Globe icon visible, placeholder or typed URL (e.g., `https://my-bank.example.com`), input field gradient background |
| 3 | `03-demo-footer.png` | Footer close-up | "Demo mode — routing simulated" text clearly readable |
| 4 | `04-connecting.png` | Connecting state | Status bar with pulse animation, "Connecting…" text, button disabled state |
| 5 | `05-secure.png` | Secure/Connected state | Green indicator dot, "Secure" status text, button showing "Connected" |
| 6 | `06-privacy-drawer.png` | Privacy drawer open | All four sections visible (Browsing, Payments, What we don't see, Current status), drawer header |
| 7 | `07-language-dropdown.png` | Language selector open | Globe icon, dropdown showing English at top, alphabetical list below divider |

---

## Capture Guidelines

### Browser Setup
- **Browser:** Chrome or Safari (incognito)
- **Window size:** 1280×800 minimum (desktop viewport)
- **Zoom:** 100% (no scaling)
- **DevTools:** Closed
- **Extensions:** Hidden or disabled

### Visual Requirements
- **No cursor** in final screenshots (or cursor positioned intentionally)
- **No browser chrome** unless specifically showing URL bar
- **Clean background** — no desktop icons, notifications, or other apps visible
- **Consistent lighting** — if using macOS, disable Night Shift

### File Format
- **Format:** PNG (lossless)
- **Naming:** Exactly as specified in table (lowercase, numbered prefix)
- **Location:** `docs/screenshots/`

---

## What Must NOT Appear

- ❌ Developer tools or console
- ❌ Browser bookmarks bar
- ❌ System notifications
- ❌ Mouse cursor (unless intentional)
- ❌ Other browser tabs
- ❌ Lovable editor UI (screenshots must be production/preview only)

---

## Validation Checklist

Before finalizing any screenshot, verify:

- [ ] Privxx logo renders correctly (gradient "Priv" + teal xx mark)
- [ ] No white box around xx mark
- [ ] Background shows teal spheres + gradient fog
- [ ] All text is readable (proper contrast)
- [ ] Footer demo notice visible (if full-page shot)
- [ ] Language is set to English
- [ ] Connection state matches intended screenshot

---

## Future Screenshots (Phase D)

When cMixx integration is live, capture additional screenshots:

| # | Filename | What It Shows |
|---|----------|---------------|
| 8 | `08-real-routing.png` | Connected state without demo notice |
| 9 | `09-latency-display.png` | Real cMixx latency metrics (if displayed) |

---

*Last updated: 2025-12-14*
