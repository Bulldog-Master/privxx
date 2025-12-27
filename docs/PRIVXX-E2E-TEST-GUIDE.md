# Privxx Live End-to-End Test

**Goal:** Prove cMixx + xxDK are actually being exercised  
**Last Updated:** 2025-12-27  
**Status:** AUTHORITATIVE

---

## Test Setup

| Device | Purpose |
|--------|---------|
| Device A | Browser (desktop or Android Chrome) |
| Device B | iPad / phone (optional, for cross-device) |
| Backend | Terminal open with xxDK logs visible |

---

## Test Steps

### STEP 1 — Health

```bash
GET https://privxx.app/health
```

**Expected:**
```json
{ "ok": true }
```

---

### STEP 2 — Login

1. Login via Supabase (magic link / passkey)
2. Verify JWT present in frontend memory (not localStorage)

---

### STEP 3 — Identity Status

```bash
GET /identity/status
Authorization: Bearer <JWT>
```

**Expected:**
```json
{ "exists": true, "state": "locked" }
```

---

### STEP 4 — Unlock

```bash
POST /identity/unlock
Authorization: Bearer <JWT>
```

**Expected:**
```json
{
  "state": "unlocked",
  "expiresAt": "ISO_TIMESTAMP"
}
```

**Backend MUST show:**
- `xxDK identity unlocked`
- `Session TTL set`

---

### STEP 5 — Send Message (REAL TEST)

```bash
POST /messages/send
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "recipient": "self",
  "message": "live test"
}
```

**Backend MUST show activity.**

⚠️ **If xxDK logs nothing → still demo mode**

---

### STEP 6 — Receive

```bash
GET /messages/inbox
Authorization: Bearer <JWT>
```

**Expected:**
- Message appears
- De-duped
- Timestamp correct

---

### STEP 7 — Lock

```bash
POST /identity/lock
Authorization: Bearer <JWT>
```

**Expected:**
- Inbox clears
- Send blocked with:
```json
{ "error": "session_expired" }
```

---

### STEP 8 — TTL Expiry (Optional)

1. Wait until `expiresAt`
2. Try sending
3. **Must fail**

---

## Result Interpretation

| Result | Meaning |
|--------|---------|
| Backend logs xxDK traffic | ✅ Real |
| Messages loop via inbox | ✅ cMixx path active |
| Send blocked when locked | ✅ Secure |
| UI stays stable | ✅ Ready |

---

## Quick Verification Commands

### SSH to Backend Server
```bash
# Check bridge is running
systemctl status privxx-bridge

# Check xx-backend is running
systemctl status xx-backend

# Tail bridge logs
tail -f /opt/xx/bridge/logs/bridge.log

# Tail xxDK logs (if separate)
tail -f /opt/xx/backend/logs/xxdk.log
```

### Expected Log Patterns (Bridge)
```
[INFO] auth validated user_id=<uuid>
[INFO] identity unlocked user_id=<uuid> ttl=300
[INFO] message queued user_id=<uuid> recipient=<id>
[INFO] xxdk send initiated msg_id=<uuid>
[INFO] cmixx routing started msg_id=<uuid>
[INFO] message sent successfully msg_id=<uuid>
```

### Failure Indicators
```
[WARN] send rejected: identity locked user_id=<uuid>
[WARN] session expired user_id=<uuid>
[ERROR] xxdk not connected
```

---

## Test Results Template

| Step | Status | Notes |
|------|--------|-------|
| 1. Health | ⬜ PASS / ⬜ FAIL | |
| 2. Login | ⬜ PASS / ⬜ FAIL | |
| 3. Identity Status | ⬜ PASS / ⬜ FAIL | |
| 4. Unlock | ⬜ PASS / ⬜ FAIL | |
| 5. Send (xxDK logs?) | ⬜ PASS / ⬜ FAIL | |
| 6. Receive | ⬜ PASS / ⬜ FAIL | |
| 7. Lock | ⬜ PASS / ⬜ FAIL | |
| 8. TTL Expiry | ⬜ PASS / ⬜ FAIL / ⬜ SKIPPED | |

---

## Definition of Done

All of the following must be true:

- [ ] Backend logs xxDK traffic (not mock responses)
- [ ] Message sent appears in inbox
- [ ] Lock prevents send
- [ ] TTL expiry enforced

**If all pass:** xxDK/cMixx integration is LIVE, not demo mode.

---

*Run this test after every deployment and before any stakeholder demo.*
