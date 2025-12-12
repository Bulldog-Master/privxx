# MVP Brief — Privxx Phase 1

## Objective

Build a **simulated prototype** that:
- Lets a user paste a URL
- Shows a privacy-themed UI
- Simulates connection latency and status
- Displays simulated results

## What This Version Does

- UI with URL input and "Connect through Privxx" button
- Simulated "connecting" status with delays
- Simulated latency values
- Placeholder content area
- Privacy principles drawer

## What This Version *Does Not Do Yet*

- Real networking through cMixx
- Real backend proxy
- Real encryption or metadata protection

---

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- No external API calls
- No analytics or tracking

---

## Privacy Constraints

- No cookies or localStorage for user data
- No persistent identifiers
- No external HTTP requests
- Dark theme default (privacy aesthetic)

---

## Next Phase

- Implement real Privxx Proxy (Go/Rust)
- Integrate xxDK for cMixx connections
- Wire UI to real backend
- Display actual proxied content
