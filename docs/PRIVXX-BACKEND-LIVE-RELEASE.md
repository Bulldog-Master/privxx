# Privxx — Backend Live Release (v0.1)

**Release Date:** TBD  
**Status:** Backend Live • Frontend Stable

---

## What's New

Privxx has transitioned from Preview (Demo) to Live Backend mode.

This release connects the frontend to the production backend through a secure, same-origin proxy—enabling real network interactions while preserving Privxx's privacy-first design.

---

## What's Now Live

### Backend connectivity enabled
- Secure server-to-server proxy in place
- Browser continues to interact only with `/api/backend/*`

### Live status reporting
- Real backend health and readiness reflected in the UI

### Seamless transition
- No UI changes required
- Demo labels automatically removed when live

---

## What Hasn't Changed

Privxx remains committed to conservative, honest privacy design:

- No tracking
- No analytics
- No cookies
- No local storage of user data
- No exposure of network internals (nodes, gateways, versions)

**Privxx does not promise perfect or absolute anonymity.**  
It is designed to reduce metadata exposure and make privacy-preserving routing accessible.

---

## App Installation

Privxx can be installed as an app (PWA):

- **Android / Desktop Chrome:** Use the "Install Privxx" prompt
- **iOS Safari:** Share → Add to Home Screen

Installed apps launch in standalone mode for an app-like experience.

---

## Diagnostics & Transparency

A new Status / Diagnostics view provides simple, read-only visibility into:

- Application mode (Live)
- Backend availability
- Network feature status
- Messaging availability

This view avoids technical details and protects user privacy.

---

## Feature Status

| Feature | Status |
|---------|--------|
| Backend connectivity | ✅ Live |
| Network routing | ✅ Live |
| Messaging | ⏳ Rolling out |
| Native mobile apps | ⏳ Planned |
| Additional features | ⏳ Incremental |

---

## Rollback & Stability

If backend instability is detected:

- The app can safely revert to Preview mode
- No user data is lost
- No reinstall required

---

## Thank You

Thank you for using Privxx and supporting a careful, privacy-first rollout.

We'll continue shipping improvements incrementally—without compromising transparency or user trust.

---

**Privxx Team**  
*Privacy-first by design*
