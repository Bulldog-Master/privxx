# Privxx Backend

This folder is a placeholder for Phase D bridge + server components.

## Current Status
**Placeholder only** — no active code yet.

## Phase D Plan

### Local Bridge Service
A companion service that runs on the user's machine:
- Exposes HTTP API for the UI
- Runs xxDK internally
- Manages identity and cMixx sessions

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/connect` | POST | Initiate cMixx session |
| `/status` | GET | Current session status |

### Message Format
```json
{
  "type": "connect",
  "targetUrl": "https://example.com",
  "timestamp": 123456789
}
```

### Success Criteria
- Server receives message over cMixx
- Server replies successfully
- UI transitions to Secure state

## Privacy Rules
- No logging of metadata
- No analytics
- No persistent identifiers
- Minimal headers
