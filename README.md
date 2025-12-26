# Privxx

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

## 🚧 Current Status: Preview Mode

Privxx is currently running in **preview (demo) mode**.

What this means:

- The user interface and connection flow are fully implemented
- Backend network routing is still being finalized
- Messaging and full cryptographic routing are not yet enabled

You may see labels such as **"Demo"**, **"Preview"**, or **"Network initializing"** — these are intentional and indicate that backend integration is in progress.

---

## 🌐 Network Integration (Coming Next)

Privxx will integrate full cryptographic routing via the **XX Network mixnet** in a future update.

This routing layer is designed to further reduce metadata correlation at the network level. Once enabled, the frontend will transition seamlessly from preview to live mode.

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

- ✅ Frontend UI & UX complete
- ✅ PWA install support (16 languages)
- ⏳ Backend routing integration
- ⏳ Messaging enablement
- ⏳ Native mobile apps (future phase)

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
| [Brand & UI Lock](docs/brand-ui-lock.md) | Visual identity rules |
| [State Machine](docs/state-machine.md) | Connection states and triggers |
| [Diagnostics View](docs/PRIVXX-DIAGNOSTICS-VIEW.md) | Status UI specification |
| [Privacy Drawer Copy](docs/privacy-drawer-copy.md) | Privacy explanations |

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

**Status:** Frontend complete, backend integration in progress
