# Privxx VPS — Ports, Binds, and API Endpoints

**Status:** AUTHORITATIVE  
**Last Updated:** December 31, 2025

---

## Network Topology

```
Public Internet
    │
    ▼
Proxy (public: 0.0.0.0:8090)
    │
    ▼
Bridge (local: 127.0.0.1:8787)
    │
    ▼
Embedded xxDK Client (in-process)
```

---

## Ports & Binds

### 1) Proxy (Public Entry)

| Property | Value |
|----------|-------|
| **Bind** | `0.0.0.0:8090` |
| **Visibility** | PUBLIC |
| **Purpose** | Only public-facing port. Receives external HTTPS/HTTP (via Cloudflare or direct) |
| **Forwards to** | Bridge on `127.0.0.1:8787` |

### 2) Bridge (Local API Surface)

| Property | Value |
|----------|-------|
| **Bind** | `127.0.0.1:8787` |
| **Visibility** | LOCAL ONLY |
| **Purpose** | Single API surface for Privxx backend features + xxDK access |
| **Exposed externally** | Only through Proxy (never directly) |

### 3) xxDK Client (Embedded)

| Property | Value |
|----------|-------|
| **Bind** | None (not exposed as a port) |
| **Purpose** | Runs long-lived client state and identity in-process (Bridge calls it directly) |

---

## Environment Variables (Bridge)

```bash
CMIXX_MODE=real|mock
BRIDGE_BIND=127.0.0.1
BRIDGE_PORT=8787
PROXY_BIND=0.0.0.0
PROXY_PORT=8090
XXDK_DATA_DIR=/opt/xx/client/state/<identity-dir>
XXDK_NDF_PATH=/opt/xx/backend/config/ndf.json
XXDK_NDF_CERT_PATH=/opt/xx/backend/config/mainnet.crt
```

---

## API Base URLs

### External (Public) — Frontend Must Use

All frontend/app calls go to the Proxy host:

```
Base URL: http(s)://<your-domain-or-ip>:8090
```

**Examples (public):**
- `http(s)://<domain>:8090/cmixx/status`
- `http(s)://<domain>:8090/xxdk/info`
- `http(s)://<domain>:8090/xxdk/client`

### Internal (Local) — VPS Testing Only

For VPS local testing only:

```
Base URL: http://127.0.0.1:8787
```

**Examples (local):**
- `http://127.0.0.1:8787/cmixx/status`
- `http://127.0.0.1:8787/xxdk/info`
- `http://127.0.0.1:8787/xxdk/client`

---

## Core Endpoints (Bridge)

### Health / Status

```
GET /cmixx/status
```
Returns readiness + phase (mock/real).

### Safe Info

```
GET /xxdk/info
```
Returns safe configuration/info about xxDK state (no secrets).

### Client State

```
GET /xxdk/client
```
Returns client state summary (locked/starting/ready/error) and notes.

---

## Current Blocking Condition (Real Mode)

Identity initialization is failing inside `client/v4` during cryptographic identity storage serialization:

```
CryptographicIdentity.save() → JSON marshal of RSA key material → large.Int ParseFloat overflow
```

- This prevents "real mode" xxDK from reaching healthy/ready state
- Proxy/Bridge routing and endpoints remain correct and usable
- **Mock mode works**; real mode blocked until identity fix

---

## Frontend Configuration

The frontend uses `src/api/bridge/index.ts` to determine the API base URL:

1. `VITE_BRIDGE_URL` environment variable (highest priority)
2. VPS Proxy URL: `http://66.94.109.237:8090` (default)
3. Mock mode: When `VITE_MOCK=true`

---

*Privxx Team — Privacy-first by design*
