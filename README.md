# Privxx

Privxx is a **privacy-first browsing and payments tunnel**.

Its purpose is to hide user metadata (IP, location, timing patterns, device fingerprints) using the **xx network (cMixx)** and **post-quantum-safe cryptography**, so that:

- Websites, banks, and merchants see only a **proxy**, not the real user.
- ISPs and on-path observers cannot see which sites the user is visiting.
- Sessions are resistant to "harvest now, decrypt later" attacks.

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

## Future Architecture (High Level)

Planned architecture:

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
