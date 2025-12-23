# Privxx Deployment Guide

**Stack:** Lovable → Cloudflare Tunnel → Bridge (localhost only) → xx-backend (systemd, private)

## Architecture Rules (LOCKED)

- ❌ DO NOT expose xx-backend to the internet
- ✅ Bridge binds to `127.0.0.1` ONLY
- ✅ Cloudflare tunnels ONLY the Bridge HTTP port
- ❌ No `go run / go build` on production unless explicitly decided

## Directory Structure

```
/opt/xx/
├── backend/
│   ├── bin/
│   │   └── xxdk-backend          # xx-backend binary
│   ├── config/
│   │   ├── ndf.json              # Network definition file
│   │   └── mainnet.crt           # Certificate
│   └── state/                    # Backend state (PRIVATE)
│
└── bridge/
    ├── bin/
    │   └── privxx-bridge         # Bridge binary
    ├── state/                    # Bridge state
    └── logs/                     # Bridge logs
```

## Cloudflare Route Plan

| Public URL | Tunnel Target |
|------------|---------------|
| `https://privxx.app/*` | `http://127.0.0.1:8090` (Bridge) |
| `https://www.privxx.app/*` | `http://127.0.0.1:8090` (Bridge) |

**Never public:** xx-backend, state directories, any internal ports

## Quick Start

1. See `systemd/` for service templates
2. See `paths.md` for directory layout
3. See `perms.md` for permissions
4. See `../docs/verification.md` for testing checklist
