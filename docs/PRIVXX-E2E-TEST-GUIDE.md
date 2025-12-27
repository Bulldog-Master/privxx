# Privxx End-to-End Live Test Guide

**Purpose:** Verify xxDK/cMixx is actually routing messages (not mock responses)  
**Last Updated:** 2025-12-27  
**Audience:** Developer / Technical QA

---

## 🎯 Test Objective

Answer definitively: **"Is xxDK actually sending messages through cMixx?"**

This test proves:
1. Bridge connects to real xxDK backend
2. Messages traverse the cMixx mixnet
3. Inbox receives routed messages
4. Unlock TTL enforcement works

---

## 📋 Prerequisites

### Environment
- SSH access to backend server
- Two devices (or two browser sessions)
- Production or staging URL accessible

### Accounts
- Two test accounts with verified email
- Both accounts can authenticate successfully

### Backend Services Running
```bash
# Verify on server
systemctl status xx-backend    # Should be active
systemctl status privxx-bridge # Should be active
ss -tlnp | grep 8090          # Bridge port listening
```

---

## 🧪 Test Procedure

### Phase 1: Backend Smoke Check

**Step 1.1 — Verify Bridge Health**
```bash
curl -s http://127.0.0.1:8090/health | jq
```

Expected:
```json
{
  "status": "ok",
  "xxdk": "connected",
  "timestamp": "..."
}
```

🔴 **FAIL if:** `xxdk: "disconnected"` or no response

---

**Step 1.2 — Tail Bridge Logs**
```bash
# Keep this running in a separate terminal
tail -f /opt/xx/bridge/logs/bridge.log
```

You will watch for activity during the test.

---

### Phase 2: Authentication & Identity

**Step 2.1 — Login (Device A)**
1. Open `https://privxx.app` on Device A
2. Sign in with test account A
3. Verify: Auth succeeds, redirected to main view

**Step 2.2 — Check Identity Status**
- UI should show identity status
- If no identity: Create one

**Step 2.3 — Unlock Identity**
1. Click unlock / enter credentials
2. Verify: Identity shows "Unlocked"
3. Note the unlock TTL countdown

🔴 **FAIL if:** Identity cannot unlock or TTL not displayed

---

**Step 2.4 — Watch Backend Logs**

After unlock, you should see in bridge logs:
```
[INFO] auth validated user_id=<uuid>
[INFO] identity unlocked user_id=<uuid> ttl=300
```

🔴 **FAIL if:** No log entries appear

---

### Phase 3: Message Send (The Critical Test)

**Step 3.1 — Compose Message**
1. On Device A, go to compose/send
2. Enter recipient (test account B's identity)
3. Enter message body: `E2E-TEST-{timestamp}`
4. Click Send

**Step 3.2 — Watch Backend Logs**

You MUST see:
```
[INFO] message queued user_id=<uuid> recipient=<recipient_id>
[INFO] xxdk send initiated msg_id=<uuid>
[INFO] cmixx routing started msg_id=<uuid>
[INFO] message sent successfully msg_id=<uuid>
```

🔴 **CRITICAL FAIL if:**
- No `xxdk send initiated` log → Still in mock mode
- `cmixx routing started` missing → xxDK not connected to network
- Any error logs appear

✅ **PASS if:** All 4 log entries appear in sequence

---

### Phase 4: Message Receive

**Step 4.1 — Login (Device B)**
1. Open `https://privxx.app` on Device B
2. Sign in with test account B
3. Unlock identity

**Step 4.2 — Check Inbox**
1. Navigate to inbox/messages
2. Wait for polling (or manual refresh)
3. Look for message: `E2E-TEST-{timestamp}`

**Step 4.3 — Watch Backend Logs**
```
[INFO] inbox poll user_id=<uuid>
[INFO] messages retrieved count=1
```

🔴 **FAIL if:** Message never appears after 60 seconds  
✅ **PASS if:** Message appears with correct content

---

### Phase 5: Lock & Rejection Test

**Step 5.1 — Lock Identity (Device A)**
1. On Device A, click Lock identity
2. Verify: UI shows "Locked"

**Step 5.2 — Attempt Send While Locked**
1. Try to send another message
2. Expected: Send should be rejected

**Step 5.3 — Watch Backend Logs**
```
[WARN] send rejected: identity locked user_id=<uuid>
```

🔴 **FAIL if:** Message sends successfully while locked  
✅ **PASS if:** Send rejected with appropriate error

---

### Phase 6: TTL Expiry Test (Optional)

**Step 6.1 — Wait for TTL**
1. Unlock identity
2. Wait for TTL countdown to reach 0
3. Attempt action (send message)

**Step 6.2 — Verify Expiry**
Expected:
- UI shows session expired
- Backend returns `session_expired` error

```
[WARN] session expired user_id=<uuid>
```

---

## 📊 Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Backend Health | ⬜ PASS / ⬜ FAIL | |
| Auth Flow | ⬜ PASS / ⬜ FAIL | |
| Identity Unlock | ⬜ PASS / ⬜ FAIL | |
| Message Send | ⬜ PASS / ⬜ FAIL | |
| Backend xxDK Logs | ⬜ PASS / ⬜ FAIL | |
| Message Receive | ⬜ PASS / ⬜ FAIL | |
| Lock Rejection | ⬜ PASS / ⬜ FAIL | |
| TTL Expiry | ⬜ PASS / ⬜ FAIL / ⬜ SKIPPED | |

---

## 🔍 Troubleshooting

### Message doesn't send
1. Check bridge logs for errors
2. Verify xxDK backend is connected to network
3. Check recipient ID is valid

### Message doesn't arrive
1. Verify recipient identity is created
2. Check inbox polling is working
3. Look for cMixx delivery logs

### "xxdk: disconnected" in health
1. Restart xx-backend service
2. Check NDF file is valid
3. Verify network connectivity

### No backend logs appearing
1. Verify you're tailing the correct log file
2. Check bridge is actually receiving requests
3. Verify Cloudflare tunnel is routing correctly

---

## ✅ Definition of Done

The E2E test is complete when:

1. ✅ Message sent from Device A
2. ✅ Backend logs show xxDK activity (not mock)
3. ✅ Message received on Device B
4. ✅ Lock prevents send
5. ✅ TTL expiry enforced

**If all pass:** xxDK/cMixx integration is LIVE, not demo mode.

---

*Run this test after every deployment and before any stakeholder demo.*
