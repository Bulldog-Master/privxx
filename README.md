# Privxx

Privxx is a **privacy-first browsing and payments tunnel**.

Its purpose is to hide user metadata (IP, location, timing patterns, device fingerprints) using the **xx network (cMixx)** and **post-quantum-safe cryptography**, so that:

- Websites, banks, and merchants see only a **proxy**, not the real user.
- ISPs and on-path observers cannot see which sites the user is visiting.
- Sessions are resistant to "harvest now, decrypt later" attacks.

---

## Architecture Overview

- **Privxx App (UI)** – React frontend (and later mobile shells) with no tracking, no persistent identifiers.
- **Privxx Proxy** – Future backend that:
  - Receives HTTP-like requests over cMixx.
  - Forwards them to real websites via HTTPS.
  - Sends responses back through cMixx.
- **xx Network (cMixx)** – Provides unlinkable routing and metadata protection. No changes to validators or gateways required.

```text
[ Privxx App (web/mobile) ]
          |
          |  xxDK + PQ Encryption
          v
[ cMixx Mixnet (xx network) ]
          |
          v
[ Privxx Proxy Server ]
          |
          |  HTTPS
          v
[ Bank / Merchant / dApp / Any Website ]
```

---

## Privacy Principles

Privxx is governed by these rules:

1. **Privacy is default.** No "enable privacy" switch.
2. **Metadata must be minimized, obfuscated, or destroyed.**
3. **All Privxx-controlled links use post-quantum-safe or hybrid crypto.**
4. **No persistent identifiers** (no analytics IDs, tracking IDs, or durable session IDs).
5. **No trust in intermediaries** – privacy from cryptography and mixnets, not promises.
6. **Zero retention** – no browsing history or tracking cookies.

---

## Phase 1 – Simulated UI Prototype

Right now, Privxx is in a **simulation / prototype** phase.  
There is **no real cMixx integration yet**.

The current web app (generated via Lovable and located in this repo) does:

- Let the user paste a URL.
- Simulate a connection:
  - Status changes from `Idle` → `Connecting through Privxx…` → `Connected (simulated)`.
  - Adds a randomized 2–3 second delay.
  - Shows a simulated latency between 500–2500 ms.
- Displays:
  - The requested URL.
  - The simulated latency.
  - A placeholder block: "Proxied content will appear here in a future version."
- Shows a **Privacy** drawer with Privxx's core privacy principles:
  - IP & location hidden (design goal).
  - Metadata removal via mixnet (cMixx).
  - Post-quantum-safe cryptography.
  - No history or persistent IDs.
  - No tracking or analytics.

This version is meant to **express the product vision and UX**, not to provide real privacy yet.

---

## Repo Layout

**Current files (Lovable default):**
- `src/` – React + TypeScript frontend
- `public/` – Static assets
- `package.json` etc. – Tooling (Vite, Tailwind, shadcn-ui)
- `docs/` – Vision, architecture, and protocol notes

**Planned additions:**
- `backend/` – Future Privxx Proxy + xxDK/cMixx integration

---

## Phase 1 Roadmap

- [x] Create Privxx repo and Lovable project
- [x] Build simulated Privxx UI shell (this repo)
- [x] Add privacy drawer and simulated latency
- [x] Add docs with MVP brief and proxy spec
- [ ] Implement real Privxx Proxy with xxDK (future)
- [ ] Wire UI to backend + cMixx (future)

---

## Internationalization (i18n)

Privxx is designed for global reach and supports multiple languages through static JSON translation files.

### Supported Languages

| Code | Language   | Status |
|------|------------|--------|
| en   | English    | ✅ Complete |
| es   | Spanish    | ✅ Complete |
| fr   | French     | ✅ Complete |
| pt   | Portuguese | ✅ Complete |
| de   | German     | ✅ Complete |
| ar   | Arabic     | ✅ Complete |
| ru   | Russian    | ✅ Complete |
| bn   | Bengali    | ✅ Complete |
| zh   | Chinese    | ✅ Complete |

### Adding a New Language

1. Create a new folder: `public/locales/<iso-code>/`
2. Add a `ui.json` file with all required keys
3. Import the file in `src/lib/i18n.ts`
4. Add the language code to `getSupportedLanguages()`
5. Add the label to `LanguageSelector.tsx`

### Translation Keys

All language files use the same key structure:

```json
{
  "appTitle": "...",
  "subtitle": "...",
  "urlPlaceholder": "...",
  "connect": "...",
  "idle": "...",
  "connecting": "...",
  "connected": "...",
  "requestedUrl": "...",
  "simulatedLatency": "...",
  "privacy": "...",
  "privacyDrawerTitle": "...",
  "privacyDrawerIntro": "...",
  "privacyDrawerPoint1": "...",
  "privacyDrawerPoint2": "...",
  "privacyDrawerPoint3": "...",
  "privacyDrawerPoint4": "...",
  "privacyDrawerPoint5": "...",
  "proxyPlaceholder": "...",
  "simulationNotice": "..."
}
```

### Features

- **Auto-detection**: Detects browser language on first load
- **Manual switching**: Language selector in the header
- **No persistence**: Language preference is session-only (privacy-first)
- **Fallback**: Falls back to English if language not supported

### Future Enhancements

- RTL (right-to-left) support for Arabic, Urdu, Hebrew
- Fallback fonts for CJK (Chinese, Japanese, Korean)
- Region-specific compliance messages (GDPR, LGPD, CCPA)

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Build Tool**: Vite
- **Hosting**: Lovable

---

## Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## License

TBD

---

## Contact

For questions about Privxx or the xx network integration, reach out to the project maintainers.
