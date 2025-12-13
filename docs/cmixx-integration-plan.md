# Privxx — cMixx Integration Plan

**Phase:** D  
**MVP:** 1 (Private Control Channel)  
**Bridge:** Option A (Local Companion Service)

---

## Overview

This plan describes the minimal integration to prove cMixx/xxDK works with Privxx.

**Goal:** Route control messages through cMixx to validate the integration before building full private browsing.

---

## MVP 1: Private Control Channel

### What It Does

- App sends "connect / status / target URL" messages through cMixx
- Server receives and responds through cMixx
- Proves: xxDK integration, cMixx messaging, session management, latency

### What It Doesn't Do (Yet)

- Doesn't make browsing itself private
- Actual web content still loads normally
- That comes in MVP 2 (Private Browsing Proxy)

---

## Architecture

```
┌─────────────────────┐
│   Privxx UI (Web)   │
│   (Lovable/React)   │
└──────────┬──────────┘
           │ HTTP (localhost)
           ▼
┌─────────────────────┐
│  Bridge Service     │
│  (Local Companion)  │
│  - Runs xxDK        │
│  - Manages identity │
│  - Handles sessions │
└──────────┬──────────┘
           │ cMixx (xxDK)
           ▼
┌─────────────────────┐
│  Privxx Server      │
│  - Receives msgs    │
│  - Responds via     │
│    cMixx            │
└─────────────────────┘
```

---

## Bridge API Endpoints

### `GET /health`

Health check for the bridge service.

**Response:**
```json
{
  "status": "ok",
  "xxdk": "initialized",
  "identity": "ready"
}
```

### `POST /connect`

Initiates a cMixx session to the server.

**Request:**
```json
{
  "targetUrl": "https://example.com",
  "timestamp": 1699999999999
}
```

**Response:**
```json
{
  "status": "connected",
  "sessionId": "abc123",
  "latency": 1250,
  "demo": false
}
```

### `GET /status`

Returns current session status.

**Response:**
```json
{
  "state": "connected",
  "sessionId": "abc123",
  "uptime": 45000
}
```

---

## Message Format

Messages sent over cMixx use this schema:

### Connect Request
```json
{
  "type": "connect",
  "targetUrl": "https://example.com",
  "timestamp": 1699999999999
}
```

### Connect Response
```json
{
  "type": "connected",
  "sessionId": "abc123",
  "capabilities": ["control-channel"],
  "demo": false
}
```

### Status Request
```json
{
  "type": "status",
  "sessionId": "abc123"
}
```

### Status Response
```json
{
  "type": "status",
  "state": "active",
  "latency": 1100
}
```

---

## Connection Flow

1. User taps **Connect**
2. UI transitions to `connecting` state
3. UI calls `POST http://localhost:<port>/connect`
4. Bridge initializes xxDK (if not already)
5. Bridge creates/uses stored identity
6. Bridge opens cMixx session to server's reception ID
7. Bridge sends connect message over cMixx
8. Server receives, responds over cMixx
9. Bridge returns response to UI
10. UI transitions to `connected` state

---

## Success Criteria

The trial is successful when:

| Metric | Target |
|--------|--------|
| xxDK integration | ✅ Working |
| cMixx session setup | ✅ Stable |
| Round-trip latency | Measured (expected 500-2500ms) |
| Session maintenance | Persists across multiple messages |
| Error handling | Graceful fallback to UI error state |

---

## What's Needed from xx Network

- xxDK client library
- Server reception ID / contact info
- Basic message format documentation
- Recommended identity storage approach

---

## Next Steps After Trial

1. Measure real latency vs simulated
2. Test session stability over time
3. Identify edge cases and errors
4. Plan MVP 2 (Private Browsing Proxy)
