# Demo Script (60 seconds)

This script demonstrates the core Privxx flow in under 60 seconds.

## Prerequisites

- Privxx app running (local or production)
- Bridge service reachable
- Test account created

## Steps

### 1. Open App (5 seconds)

Navigate to the Privxx app. Observe the landing page with connection status.

### 2. Check Diagnostics (10 seconds)

Open the Diagnostics panel. Show:

- Connection path (Proxy → Bridge → xxDK)
- Status indicators for each layer
- Health score

### 3. Unlock Identity (10 seconds)

- Click "Unlock Identity"
- Enter password
- Observe status change to "Unlocked"
- Note the TTL countdown

### 4. Send Message to Self (15 seconds)

- Open Compose panel
- Set recipient to "self"
- Type a test message
- Click Send
- Observe "Queued" confirmation

### 5. Wait for Inbox Arrival (10 seconds)

- Switch to Inbox panel
- Wait for message to appear
- Verify message content matches

### 6. Lock Identity (10 seconds)

- Click "Lock Identity"
- Observe status change to "Locked"
- Verify compose/inbox actions are disabled

## Expected Outcomes

- ✅ All connection indicators green
- ✅ Identity unlock/lock cycle works
- ✅ Send-to-self roundtrip completes
- ✅ Message appears in inbox

## Troubleshooting

| Issue | Check |
|-------|-------|
| Connection failed | Verify Bridge URL, check Proxy |
| Identity unlock fails | Check password, verify session |
| Message not received | Check Bridge logs, verify cMixx |
