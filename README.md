# Privxx

![CI](https://github.com/Bulldog-Master/privxx/actions/workflows/ci.yml/badge.svg)

**Private access to the internet and payments — without fear, friction, or exposure.**

Privxx is a privacy-first tunnel that hides your IP, location, timing patterns, and device fingerprints using the **xx network (cMixx)** and **post-quantum-safe cryptography**.

---

## 🎨 UI & Brand Lock

Privxx has a **locked visual identity**.

The current UI is final for demo and MVP stages.  
No visual changes are permitted without updating:
- `docs/brand-ui-lock.md`
- `docs/PRIVXX-DESIGN-CONSTITUTION.md`

**Functional changes are allowed.**  
**Visual reinterpretation is not.**

---

## Current Status

> **Privxx is currently running in preview mode while network routing is finalized.**

✅ **Frontend Complete** — UI, PWA install, 16 languages, privacy copy locked  
✅ **App Store Ready** — Reviewer-safe language, no over-claims  
🔜 **Backend Integration** — Awaiting xx team backend + cMixx connection

The app demonstrates the full user experience with simulated routing. Real cryptographic routing via the XX Network mixnet will be integrated once the backend is confirmed stable.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [Brand & UI Lock](docs/brand-ui-lock.md) | Approved visual style, what's allowed/banned |
| [State Machine](docs/state-machine.md) | Connection states, triggers, UI behavior |
| [Privacy Drawer Copy](docs/privacy-drawer-copy.md) | Final wording for privacy explanations |
| [cMixx Integration Plan](docs/cmixx-integration-plan.md) | Phase D technical approach |

---

## What Privxx Does

- **Browsing:** Routes requests through a privacy network that removes identifying metadata
- **Payments:** Separates your identity from your transactions
- **Protection:** Post-quantum-safe cryptography guards against future attacks

---

## Architecture

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

> **Phase D note:** The first integration milestone uses cMixx as a private control channel (connect/status/target URL). Full HTTP-like proxy routing comes later.

---

## Privacy Principles

1. **Privacy is default.** No "enable privacy" switch.
2. **Metadata minimized, obfuscated, or destroyed.**
3. **Post-quantum-safe cryptography** on all Privxx-controlled links.
4. **No persistent identifiers** — no analytics, tracking, or durable session IDs.
5. **No trust in intermediaries** — privacy from cryptography, not promises.
6. **Zero retention** — no browsing history or tracking cookies.

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

Privxx is designed for global reach and supports multiple languages through static JSON translation files stored in:

```
public/locales/<iso-code>/ui.json
```

### ✔ Supported Languages (16)

English, Spanish, French, Portuguese, German, Arabic, Russian, Bengali, Chinese, Hindi, Urdu, Indonesian, Japanese, Dutch, Turkish, Korean

All translations are privacy-safe and reviewer-compliant. No anonymity guarantees are made in any language.

### 🌐 Detection & Switching

- On initial load, Privxx auto-detects browser language.
- If unsupported, it defaults to **English**.
- Users may manually switch languages via the language selector in the header.
- Language preference is session-only (privacy-first — no persistent storage).

### 🧩 Developer Notes

To add a new language, create:

```
public/locales/<iso-code>/ui.json
```

With this key structure:

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

Then update:
1. `src/lib/i18n.ts` — import and add to translations object
2. `src/components/LanguageSelector.tsx` — add label

### Globalization & Script Support

Privxx is designed to support multiple writing systems:

- **LTR**: English, Spanish, French, Portuguese, German, Dutch, Turkish, Indonesian, Russian, etc.
- **CJK**: Chinese (zh), Japanese (ja), Korean (ko)
- **Indic scripts**: Hindi (hi), Bengali (bn)
- **RTL**: Arabic (ar), Urdu (ur)

The UI:
- Switches `dir="rtl"` automatically for Arabic and Urdu.
- Uses system font stacks for privacy and broad script coverage (no external font CDNs).
- Loads all translations from local JSON files only (no external translation CDNs).
- Language preference is session-only (privacy-first — no persistent storage).

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Build Tool**: Vite
- **Hosting**: Lovable

---

## Development

**Important:** Use npm only. Do not use bun or yarn.

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Lint
npm run lint

# Build
npm run build
```

---

## License

MIT — see [LICENSE](LICENSE)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

---

## Contact

For questions about Privxx or the xx network integration, reach out to the project maintainers.
