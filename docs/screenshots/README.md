# Privxx Screenshot Governance

This folder contains the **only approved screenshots** of the Privxx UI.

Screenshots are treated as **canonical visual artifacts** and must always
reflect the currently locked UI and brand.

If a screenshot does not comply with these rules, it must not be used.

---

## Authoritative References
All screenshots must conform to:
- `docs/brand-ui-lock.md`
- `docs/PRIVXX-DESIGN-CONSTITUTION.md`
- `docs/PRIVXX-WHAT-CHANGES-WHAT-DOESNT.md`

---

## Purpose
Screenshots are used for:
- documentation
- demos
- presentations
- stakeholder reviews
- future development reference

Incorrect or outdated screenshots cause confusion and UI drift.

---

## Required Screenshots

### 1) Home — Idle State
**Filename:**  
`privxx-home-idle.png`

**Must show:**
- Privxx logo with correct styling (gradient text + teal xx mark)
- Single ambient teal dot above-left of logo
- Left-side controls: globe icon (no background) + privacy button (gradient)
- URL input field with globe icon inside
- "Connect through Privxx" button (gradient background)
- Status bar: "Idle / Ready to connect privately"
- Footer demo disclaimer
- Full background visible (teal spheres, bottom gradient glow)

---

### 2) Connecting State
**Filename:**  
`privxx-connecting.png`

**Must show:**
- Identical layout to Idle
- Status bar: "Connecting… / Establishing private route"
- Animated pulse on status bar
- No color, layout, or branding changes

---

### 3) Secure State
**Filename:**  
`privxx-secure.png`

**Must show:**
- Status bar: "Secure / Private routing active"
- Green dot indicator
- Calm, stable appearance
- No dramatic visual differences from other states

---

### 4) Privacy Drawer Open
**Filename:**  
`privxx-privacy-drawer.png`

**Must show:**
- Privacy drawer open from right side
- Dark overlay on main content
- Header: "How Privxx protects you"
- Three sections: intro, "designed to" (3 points), "does not" (3 points), status
- Consistent Privxx branding
- No overlapping or clipped UI elements

---

### 5) Language Dropdown (Optional)
**Filename:**  
`privxx-language-dropdown.png`

**Must show:**
- Globe icon clicked, dropdown open
- English pinned at top with separator
- Remaining languages alphabetical by native name

---

## Rules (Non-Negotiable)

- Screenshots must be taken from the **actual running app**
- No mockups, design tools, or edited composites
- No experimental or unreleased UI states
- No cropping that removes context
- No alternative themes or modes unless explicitly approved

---

## Enforcement

Only screenshots in this folder are valid references.

If a screenshot does not match the locked UI:
- It must be replaced
- Or removed entirely
