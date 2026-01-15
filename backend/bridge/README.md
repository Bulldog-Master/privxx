# Privxx Bridge (Phase D)

Local companion service that wraps xxDK and exposes HTTP endpoints for the Privxx UI.

> **Architecture Reference:** See [PRIVXX-VPS-ARCHITECTURE.md](../../docs/PRIVXX-VPS-ARCHITECTURE.md) for the authoritative port/bind topology.

## Network Topology

```
Public Internet
    │
    ▼
Proxy (0.0.0.0:8090) ← Frontend connects here
    │
    ▼
Bridge (127.0.0.1:8787) ← Local API surface
    │
    ▼
xxDK Client (embedded, in-process)
```

### Port Separation

| Component | Bind | Port | Visibility |
|-----------|------|------|------------|
| **Proxy** | `0.0.0.0` | `8090` | PUBLIC — All external traffic |
| **Bridge** | `127.0.0.1` | `8787` | LOCAL — VPS internal only |
| **xxDK** | N/A | N/A | Embedded in Bridge process |

## Quick Start

```bash
cd backend/bridge
go run main.go
```

The bridge runs on `http://127.0.0.1:8787` by default (local only).
External access requires the Proxy on port `8090`.

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check, xxDK status |
| `/cmixx/status` | GET | Mixnet readiness + phase |
| `/xxdk/info` | GET | Safe xxDK configuration info |
| `/xxdk/client` | GET | Client state summary |
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

### GET /cmixx/status

Returns mixnet readiness and phase.

```json
{
  "ready": true,
  "phase": "mock",
  "timestamp": "2025-12-31T12:00:00Z"
}
```

### GET /xxdk/info

Returns safe xxDK configuration (no secrets).

```json
{
  "mode": "mock",
  "version": "v4.x.x",
  "identity": "present",
  "timestamp": "2025-12-31T12:00:00Z"
}
```

### GET /xxdk/client

Returns client state summary.

```json
{
  "state": "ready",
  "notes": "Mock mode active"
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

## Environment Variables

```bash
CMIXX_MODE=real|mock
BRIDGE_BIND=127.0.0.1
BRIDGE_PORT=8787
PROXY_BIND=0.0.0.0
PROXY_PORT=8090
```

## Privacy Rules

- No logging of full URLs with parameters
- No logging of user identity or session data
- No analytics or telemetry
- Minimal console output for debugging only

## CORS

CORS is enabled for all origins to allow the Lovable-hosted UI to call the Proxy during development.

## Frontend Connection

The frontend connects via:
1. `VITE_BRIDGE_URL` environment variable (local dev override only)
2. Canonical URL: `https://privxx.app` (production default - per API contract)

The frontend diagnostics show which path is active.
