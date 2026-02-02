PRIVXX — PHASE 7 HANDOFF (ONE-PASTE) — Feb 2, 2026
Owner: Bulldog
Timezone: America/Costa_Rica

========================================================
PHASE 7 GOAL
========================================================
Implement basic Messaging + Browsing endpoints (Preview + Fetch) while:
- Keeping SSRF protections strong
- Keeping "NODEV" mode locked down (no dev bypass)
- Keeping Phase 6 architecture intact (Option A: backend owns xxDK; bridge is the only public API surface)

========================================================
WHAT WE BUILT (Phase 7)
========================================================
A) Messaging
- /message/send (POST) accepts a message (DEV bypass used for build-VPS testing)
- /message/inbox (GET) returns stored messages (DEV testing)

B1) Browsing Preview
- /browse/preview (POST) returns:
  - url, finalUrl, fetchedAt, status, contentType, title (+ optional metadata fields)
- Does NOT return full content/body
- Does NOT follow redirects (predictable + smaller abuse surface)

B2) Browsing Fetch
- /browse/fetch (POST) returns:
  - url, finalUrl, fetchedAt, status, contentType, title, text
- "text" is a safe plaintext reduction:
  - Body read capped (256KB)
  - <script>/<style>/<noscript> blocks removed WITH contents
  - Remaining HTML tags stripped
  - Whitespace collapsed
- Redirects are allowed (max 5) but each redirect host is re-validated.

========================================================
SECURITY (SSRF + INPUT VALIDATION)
========================================================
SSRF blocking behavior (confirmed):
- localhost / localhost.localdomain => 403 forbidden_target
- 127.0.0.1 and private IP literals => 403 forbidden_target
- 169.254.169.254 (cloud metadata link-local) => 403 forbidden_target
- non-http(s) schemes (file:// etc.) => 400 bad_request

Validation hardening:
- URL length capped (2048)
- Requires scheme + host
- Only http/https schemes permitted
- Timeouts: preview 6s, fetch 12s
- Redirect cap: 5 hops
- Body cap: 256KB

========================================================
PHASE 7 LOCK GATE (CRITICAL)
========================================================
ENVIRONMENT=development (DEV):
- Allows /message/* and /browse/* for testing on build VPS

ENVIRONMENT unset (NODEV):
- /message/send => 403 forbidden
- /browse/fetch => 403 forbidden

Phase 7 is LOCKED when:
- No listeners on ports 8090 or 8790
- Bridge and backend processes are stopped
- Only documentation, backups, GitHub sync, and Phase 8 planning may proceed

========================================================
VERIFICATION SUMMARY (PASSED)
========================================================
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

========================================================
BACKUP (BUILD VPS)
========================================================
Backup created:
- /opt/privxx/backups/phase7_20260202T210226Z_privxx-src.tgz
- /opt/privxx/backups/phase7_20260202T210226Z_privxx-src.tgz.sha256

========================================================
NEXT (Phase 8 direction)
========================================================
Phase 8 should replace DEV-bypass messaging/browsing with real auth + unlock gating:
- Frontend gets Supabase JWT
- Bridge validates JWT (Supabase /auth/v1/user or JWKS)
- /unlock starts identity session TTL
- /message/* and /browse/* require both auth + unlocked session (NODEV production posture)
