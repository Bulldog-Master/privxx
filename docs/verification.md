# Privxx Verification Checklist

Pre-Lovable verification — NO MOCKS.

---

## 1. Service Status

```bash
# xx-backend running
systemctl status xx-backend --no-pager
# Expected: active (running)

# Bridge running
systemctl status privxx-bridge --no-pager
# Expected: active (running)

# Cloudflare tunnel running
systemctl status cloudflared --no-pager
# Expected: active (running)
```

---

## 2. Local Bridge Tests

```bash
# Health check
curl -sS http://127.0.0.1:8090/cmixx/status && echo
# Expected: {"ok":true,"mode":"real","ready":true,...}

# xxdk info
curl -sS http://127.0.0.1:8090/xxdk/info && echo
# Expected: {"ok":true,"mode":"real","phase":"ready",...}

# Client identity
curl -sS http://127.0.0.1:8090/xxdk/client && echo
# Expected: {"ok":true,"transmissionId":"...","receptionId":"...",...}

# Inbox (read-only)
curl -sS http://127.0.0.1:8090/cmixx/inbox && echo
# Expected: {"ok":true,"count":0,"items":[]}

# Send (should return 501)
curl -sS -X POST http://127.0.0.1:8090/cmixx/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test","body":"hello"}' && echo
# Expected: {"ok":false,"error":"not implemented..."}
```

---

## 3. Cloudflare Tunnel Tests

```bash
# Public health
curl -sS https://privxx.app/cmixx/status && echo
# Expected: same as local

# Public identity
curl -sS https://privxx.app/xxdk/client && echo
# Expected: same as local

# CORS check (from browser or with Origin header)
curl -sS -H "Origin: https://example.com" \
  -I https://privxx.app/cmixx/status 2>&1 | grep -i access-control
# Expected: Access-Control-Allow-Origin header present
```

---

## 4. Restart Recovery Tests

```bash
# Restart bridge (xx-backend untouched)
sudo systemctl restart privxx-bridge
sleep 3
curl -sS http://127.0.0.1:8090/cmixx/status
# Expected: still works

# Restart cloudflared
sudo systemctl restart cloudflared
sleep 5
curl -sS https://privxx.app/cmixx/status
# Expected: still works

# Restart xx-backend (bridge should recover)
sudo systemctl restart xx-backend
sleep 10
curl -sS http://127.0.0.1:8090/cmixx/status
# Expected: recovers without corruption
```

---

## 5. Error Handling Tests

```bash
# Wrong method
curl -sS -X POST http://127.0.0.1:8090/cmixx/status
# Expected: 405 {"ok":false,"error":"GET only"}

# Invalid JSON
curl -sS -X POST http://127.0.0.1:8090/cmixx/send \
  -H "Content-Type: application/json" \
  -d 'not json'
# Expected: 400 {"ok":false,"error":"invalid json"}

# Missing fields
curl -sS -X POST http://127.0.0.1:8090/cmixx/send \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 {"ok":false,"error":"to and body required"}
```

---

## ✅ All Passed?

If all tests pass:
1. Backend is stable
2. Bridge is working
3. Cloudflare tunnel is routing correctly
4. Ready for Lovable integration

Proceed to `docs/PRIVXX-BACKEND-HANDOFF-LOCKED.md` for Lovable API contract.
