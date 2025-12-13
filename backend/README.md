# Privxx Backend

This folder contains backend components for Privxx.

## Structure

```
backend/
├── bridge/              # Phase D: Local companion service
│   ├── main.go          # HTTP server with /health, /connect, /status
│   ├── go.mod           # Go module definition
│   └── README.md        # Bridge documentation
├── privxx-proxy-spec.md # Phase 2: Full proxy specification
└── README.md            # This file
```

## Phase D: Bridge (Current)

The bridge is a local Go service that wraps xxDK and exposes HTTP endpoints for the UI.

```bash
cd bridge
go run main.go
# Runs on http://localhost:8090
```

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/connect` | POST | Initiate cMixx session |
| `/status` | GET | Current session status |
| `/disconnect` | POST | Reset session |

### Current Status

🚧 **Simulated** — xxDK calls are stubbed. Real integration next.

## Phase 2: Proxy (Future)

Full HTTP-like proxy over cMixx. See [privxx-proxy-spec.md](privxx-proxy-spec.md).

## Privacy Rules

- No logging of metadata
- No analytics
- No persistent identifiers
- Minimal headers
