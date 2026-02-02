# PHASE 7 — CHEATSHEET (Messaging + Browsing)

## What Phase 7 delivered
A) Messaging (DEV-only bypass)
- POST /message/send  -> {"accepted":true}
- GET  /message/inbox -> {"messages":[...]}

B1) Browsing Preview (metadata-safe)
- POST /browse/preview -> title/ctype/status/finalUrl (no full body)

B2) Browsing Fetch (safe text extraction)
- POST /browse/fetch -> includes "text" (sanitized, no CSS/JS, capped)

## Safety / Security
SSRF protections (fetch + redirects):
- Blocks localhost/loopback
- Blocks private / link-local / multicast ranges
- DNS resolution is checked (denyPrivateTargets)
- Redirects re-validated per hop

Input validation:
- Only http/https
- URL length capped (2048)
- Body read capped (256KB)
- Redirect hops capped (5)
- Timeouts (preview: 6s, fetch: 12s)

Text cleaning:
- Removes <script>/<style>/<noscript> blocks and contents
- Strips remaining tags
- Collapses whitespace

## Phase 7 Lock Gate
DEV mode (ENVIRONMENT=development):
- Allows /message/* and /browse/* for testing

NODEV (ENVIRONMENT unset):
- /message/send -> 403 forbidden
- /browse/fetch -> 403 forbidden

## Local DEV quick commands (build VPS)
- Start fresh DEV:  /opt/privxx/dev-reset.sh
- Verify DEV works:
  curl -sS -i -X POST http://127.0.0.1:8090/message/send -H "Content-Type: application/json" \
    -d '{"recipient":"test","payload":"hello","clientTime":"2026-02-02T00:00:00Z"}' | sed -n '1,25p'
  curl -sS -i -X POST http://127.0.0.1:8090/browse/preview -H "Content-Type: application/json" \
    -d '{"url":"https://example.com","clientTime":"2026-02-02T00:00:00Z"}' | sed -n '1,60p'
  curl -sS -i -X POST http://127.0.0.1:8090/browse/fetch -H "Content-Type: application/json" \
    -d '{"url":"https://example.com","clientTime":"2026-02-02T00:00:00Z"}' | sed -n '1,80p'

## Phase 7 locked means
- No listeners on 8090/8790
- No DEV/NODEV bridge running
- No xx-backend.dev running
- Only docs/backups/GitHub sync/Phase 8 planning allowed
