# Canonical Screenshots

These screenshots are the **single source of truth** for Privxx UI visuals.
If a screen differs from these images, the UI is considered **out of spec**.

---

## Purpose

- Screenshots represent **approved UI states**
- No visual changes allowed without updating screenshots
- Screenshots define expected behavior during demos, audits, and reviews

---

## Canonical Screens

### 1) Home — Idle (Locked)
**File:** `home-idle.png`  
**What it proves:**
- Background is the locked "vibrant spheres + gradient haze" style
- Top-left icons are **globe above** and **Privacy** below
- The "Priv" wordmark is gradient and includes the xx logo mark
- Connection panel uses the same gradient treatment on:
  - URL field row
  - Connect row
  - Status row
- Status shows:
  - **Idle**
  - **Ready to connect privately** (subtext)

### 2) Privacy Drawer — Open (Locked)
**File:** `privacy-drawer-open.png`  
**What it proves:**
- Drawer title: "How Privxx protects you"
- Sections:
  - Intro paragraph + preview note
  - "Privxx is designed to:" bullet list
  - "Privxx does not:" bullet list
  - "Current status" note re: demo + cMixx coming next
- Icons and spacing match the locked look

### 3) Connected — Secure (Demo Mode)
**File:** `connected-secure-demo.png`  
**What it proves:**
- Successful private routing connection to an HTTPS destination
- Status shows:
  - **Secure**
  - **Private routing active** (subtext)
- Content area displays:
  - Requested URL
  - Simulated latency
  - "Proxied content will appear here once full private routing is enabled."
- Footer disclaimer: "Demo mode — secure routing simulated for preview"
- **Phase D acceptance:** This screen must remain visually identical when real cMixx routing replaces simulation

---

## Governance Rules

1. If a screenshot does not match the locked UI, it must be deleted/replaced
2. Only screenshots in `docs/screenshots/` may be referenced in README, architecture docs, demo scripts, and presentations
3. No mockups or Figma exports — actual running app only
4. No experimental UI states
5. No cropping that removes context
