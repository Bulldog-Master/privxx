# Privxx Troubleshooting Guide

## Known Errors

### Error A: Identity Create Crash

**Symptom:**
```
Failed to store the new Cryptographic Identity: json: error calling MarshalJSON for type *large.Int … value out of range
```

**Location:** `client/v4 storage/user/newCryptographicIdentity`

**Cause:** Issue within xxdk v4's identity creation/serialization.

**Status:** Worked around by using persistent identity; do not trigger identity recreation.

---

### Error B: State Directory Permission Denied

**Symptom:**
```
LoadCmix failed… Invalid read… open /opt/xx/backend/state/.ekv.*: permission denied
```

**Cause:** Bridge process attempting to read/write backend state directory it doesn't own.

**Solution:**
1. Bridge must use its OWN state directory (`/opt/xx/bridge/state/`)
2. Bridge should NOT access `/opt/xx/backend/state/`
3. Verify permissions:
   ```bash
   ls -la /opt/xx/backend/state/
   # Should show: drwx------ xxuser xxuser
   ```

---

### Error C: CORS Rejection

**Symptom:** Browser console shows:
```
Access to fetch at 'https://privxx.app/cmixx/status' from origin 'https://....lovable.app' has been blocked by CORS policy
```

**Cause:** Bridge not sending CORS headers.

**Solution:** Add CORS headers to Bridge HTTP responses:
```go
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
```

---

### Error D: Cloudflare Tunnel Offline

**Symptom:** `https://privxx.app/cmixx/status` returns 502 or connection refused.

**Diagnosis:**
```bash
# Check tunnel status
systemctl status cloudflared

# Check bridge is running
curl -sS http://127.0.0.1:8090/cmixx/status
```

**Solution:**
```bash
systemctl restart cloudflared
```

---

## Diagnostic Commands

```bash
# Check all services
systemctl status xx-backend --no-pager
systemctl status privxx-bridge --no-pager
systemctl status cloudflared --no-pager

# Test bridge locally
curl -sS http://127.0.0.1:8090/cmixx/status | jq .

# Test through Cloudflare
curl -sS https://privxx.app/cmixx/status | jq .

# Check logs
journalctl -u xx-backend -n 50 --no-pager
journalctl -u privxx-bridge -n 50 --no-pager
journalctl -u cloudflared -n 50 --no-pager
```
