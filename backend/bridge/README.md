# Privxx Bridge (Phase D)

Local companion service that wraps xxDK and exposes HTTP endpoints for the Privxx UI.

## Quick Start

```bash
cd backend/bridge
go run main.go
```

The bridge runs on `http://localhost:8090` by default.

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check, xxDK status |
| `/connect` | POST | Initiate cMixx connection |
| `/status` | GET | Current session state |
| `/disconnect` | POST | Reset session |

## API Reference

### GET /health

Returns bridge health and xxDK readiness.

```json
{
  "status": "ok",
  "version": "0.1.0",
  "xxdkReady": false
}
```

### POST /connect

Initiates a cMixx connection to the target URL.

**Request:**
```json
{
  "targetUrl": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "sim-1234567890"
}
```

### GET /status

Returns current session state.

```json
{
  "state": "secure",
  "targetUrl": "https://example.com",
  "sessionId": "sim-1234567890",
  "latency": 2150
}
```

**States:** `idle`, `connecting`, `secure`, `error`

### POST /disconnect

Resets the session to idle.

```json
{
  "success": true
}
```

## Current Status

🚧 **Simulated** — xxDK integration is stubbed. The bridge simulates:
- 2-second connection delay
- Session ID generation
- State transitions

## Next Steps (Real xxDK Integration)

1. Add xxDK dependency to `go.mod`
2. Initialize xxDK client on startup
3. Store/load identity from secure storage
4. Replace simulated `/connect` with real cMixx send
5. Parse server response and transition to Secure

## Privacy Rules

- No logging of full URLs with parameters
- No logging of user identity or session data
- No analytics or telemetry
- Minimal console output for debugging only

## CORS

CORS is enabled for all origins to allow the Lovable-hosted UI to call the local bridge during development.
