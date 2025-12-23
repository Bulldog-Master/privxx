# Privxx Path Reference

## xx-backend Paths

| Path | Purpose |
|------|---------|
| `/opt/xx/backend/bin/xxdk-backend` | Backend binary (xxdk v4) |
| `/opt/xx/backend/config/ndf.json` | Network definition file |
| `/opt/xx/backend/config/mainnet.crt` | Mainnet certificate |
| `/opt/xx/backend/state/` | Backend persistent state (PRIVATE) |

## Bridge Paths

| Path | Purpose |
|------|---------|
| `/opt/xx/bridge/bin/privxx-bridge` | Bridge HTTP server binary |
| `/opt/xx/bridge/state/` | Bridge state directory |
| `/opt/xx/bridge/logs/` | Bridge log files |

## Important Notes

- Backend state contains sensitive cryptographic material
- Bridge should NOT share state directory with backend
- All binaries should be owned by root, executable by service user
- State directories owned by service user only
