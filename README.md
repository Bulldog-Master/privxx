# Privxx

![Demo Smoke](https://github.com/Bulldog-Master/privxx/actions/workflows/demo-smoke.yml/badge.svg)
![Security Rating](https://img.shields.io/badge/Security-100%2F100-brightgreen?style=flat-square&logo=shield&logoColor=white)
![RLS Policies](https://img.shields.io/badge/RLS-RESTRICTIVE-blue?style=flat-square)
![Languages](https://img.shields.io/badge/i18n-16%20languages-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

Privxx is a privacy-first application designed to reduce metadata exposure during online interactions.

This project focuses on making privacy-preserving network routing feel simple, familiar, and accessible — without requiring users to understand cryptography or networking.

---

## 🔒 Privacy Philosophy

Privxx is designed to:

- Reduce metadata exposure (such as IP address, location, and timing)
- Avoid tracking by default
- Keep the user experience simple and transparent

Privxx does **not**:

- Promise perfect or absolute anonymity
- Track users or collect personal data
- Require technical knowledge to use

---

## 🚧 Current Status: Phase 4 Complete (Backend Hardened)

Privxx has completed **Phase 4 — Backend Core + Bridge Hardening**.

What this means:

- The user interface and connection flow are fully implemented
- Backend architecture is hardened and locked (Bridge + Backend Core)
- Frontend → Bridge → Backend Core topology is production-ready
- Messaging and tunnel features remain disabled until Phase 5

You may see labels such as **"Demo"** or **"Network initializing"** — these indicate that full mixnet routing is not yet enabled at the product level.

---

## 🌐 Network Integration (Phase 5)

Privxx will enable full cryptographic routing via the **XX Network mixnet** in Phase 5.

The hardened foundation (Phase 4) is complete. Phase 5 will enable messaging and tunnel capabilities on top of the locked architecture.

---

## 📱 Install as an App (PWA)

Privxx can be installed as an app on supported devices:

- **Android / Desktop Chrome:** Use the "Install Privxx" prompt
- **iOS Safari:** Share → Add to Home Screen

No app store account is required during preview mode.

---

## 🧪 No Tracking, No Telemetry

Privxx does not use:

- Analytics
- Cookies
- Tracking pixels
- Persistent identifiers

The application is privacy-first by design.

---

## 📌 Roadmap (High Level)

- ✅ Phase 0: Foundation (UI/UX, i18n, PWA)
- ✅ Phase 1: Demo Messaging (Identity UX, Inbox polling)
- ✅ Phase 2: Intent + Policy (Browser signals, stubs)
- ✅ Phase 3: Messaging Design (Frontend orchestration locked)
- ✅ Phase 4: Backend Hardening (Bridge + Core locked)
- ⏳ Phase 5: Messaging + Tunnel Enablement
- ⏳ Phase 6: Native Mobile Apps

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full roadmap with Mermaid diagram.

---

## 📚 Docs (GitHub Pages)

Privxx docs are built with **MkDocs Material** and deployed automatically to GitHub Pages.

### Local preview

```bash
pip install mkdocs-material
mkdocs serve
```

Then open: http://127.0.0.1:8000/

---

## ℹ️ Transparency

Privxx aims to be clear and honest about its capabilities at every stage.

Features labeled as "coming soon" or "preview" are intentionally not represented as live.

---

## 🌍 Internationalization

Privxx supports 16 languages with privacy-safe, reviewer-compliant translations:

English, Spanish, French, Portuguese, German, Arabic, Russian, Bengali, Chinese, Hindi, Urdu, Indonesian, Japanese, Dutch, Turkish, Korean

---

## 🛠️ Development

```sh
npm install
npm run dev
npm run build
```

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [OpenAPI Spec](docs/openapi.yaml) | Bridge API contract (v1) |
| [Roadmap](docs/ROADMAP.md) | Public roadmap with Mermaid diagram |
| [Brand & UI Lock](docs/brand-ui-lock.md) | Visual identity rules |
| [State Machine](docs/state-machine.md) | Connection states and triggers |
| [Diagnostics View](docs/PRIVXX-DIAGNOSTICS-VIEW.md) | Status UI specification |
| [Privacy Drawer Copy](docs/privacy-drawer-copy.md) | Privacy explanations |
| [Security Compliance Report](docs/PRIVXX-SECURITY-COMPLIANCE-REPORT.md) | 100/100 security rating verification |

---

## 📜 License

MIT — see [LICENSE](LICENSE)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

---

**Status:** Phase 4 complete — Backend hardened, messaging/tunnel pending Phase 5
