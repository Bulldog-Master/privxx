# PHASE 7 — LOCKED (Messaging + Browsing)

Date: 2026-02-02  
Owner: Bulldog  
Environment: privxx-build (DEV only)

---

## Scope Completed

### A) Messaging
- POST /message/send
- GET  /message/inbox

### B1) Browsing Preview
- POST /browse/preview

### B2) Browsing Fetch (Text Extraction)
- POST /browse/fetch

---

## Security & Privacy Guarantees

### SSRF Hardening
Browsing endpoints enforce SSRF protection:

- Block localhost hostnames (localhost, localhost.localdomain)
- Block private IPv4 + IPv6 ranges
- Block link-local (169.254.0.0/16), loopback, multicast
- DNS resolution validated against private ranges
- Redirect targets re-validated on every hop
- Non-http(s) schemes rejected (file://, ftp://, etc)

### DEV vs NODEV Gate
- ENVIRONMENT=development:
  - Messaging and browsing endpoints enabled
- ENVIRONMENT unset (NODEV):
  - Messaging and browsing endpoints return 403 forbidden

---

## Verification Summary

DEV mode:
- /health → 200
- /message/send → 200 {"accepted":true}
- /message/inbox → 200 with messages
- /browse/preview → 200
- /browse/fetch → 200 with clean text (no CSS/JS)

SSRF tests:
- http://127.0.0.1 → 403 forbidden_target
- http://169.254.169.254 → 403 forbidden_target
- file:///etc/passwd → 400 bad_request

NODEV mode:
- /message/send → 403
- /browse/fetch → 403

---

## Lock Confirmation

Phase 7 is LOCKED when:
- No listeners on ports 8090 or 8790
- Bridge and backend processes are stopped
- Only documentation, backups, GitHub sync, and Phase 8 planning may proceed

