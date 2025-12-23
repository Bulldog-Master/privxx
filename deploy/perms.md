# Privxx Permissions Reference

## Service User

```bash
# Create dedicated user (no login shell)
useradd --system --no-create-home --shell /usr/sbin/nologin xxuser
```

## Directory Ownership

| Path | Owner | Group | Mode |
|------|-------|-------|------|
| `/opt/xx/` | root | root | 755 |
| `/opt/xx/backend/bin/` | root | root | 755 |
| `/opt/xx/backend/bin/xxdk-backend` | root | root | 755 |
| `/opt/xx/backend/config/` | root | xxuser | 750 |
| `/opt/xx/backend/config/ndf.json` | root | xxuser | 640 |
| `/opt/xx/backend/config/mainnet.crt` | root | xxuser | 640 |
| `/opt/xx/backend/state/` | xxuser | xxuser | 700 |
| `/opt/xx/bridge/bin/` | root | root | 755 |
| `/opt/xx/bridge/bin/privxx-bridge` | root | root | 755 |
| `/opt/xx/bridge/state/` | xxuser | xxuser | 700 |
| `/opt/xx/bridge/logs/` | xxuser | xxuser | 750 |

## Setup Commands

```bash
# Set ownership
chown -R root:root /opt/xx/backend/bin
chown -R root:xxuser /opt/xx/backend/config
chown -R xxuser:xxuser /opt/xx/backend/state
chown -R root:root /opt/xx/bridge/bin
chown -R xxuser:xxuser /opt/xx/bridge/state
chown -R xxuser:xxuser /opt/xx/bridge/logs

# Set permissions
chmod 755 /opt/xx/backend/bin/xxdk-backend
chmod 750 /opt/xx/backend/config
chmod 640 /opt/xx/backend/config/*
chmod 700 /opt/xx/backend/state
chmod 755 /opt/xx/bridge/bin/privxx-bridge
chmod 700 /opt/xx/bridge/state
chmod 750 /opt/xx/bridge/logs
```

## Security Notes

- ⚠️ NO passwords or secrets in this repo
- State directories (700) are readable ONLY by service user
- Config files (640) readable by service user, not world
- Binaries owned by root to prevent tampering
