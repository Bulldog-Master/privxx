# PRIVXX FRONTEND ↔ BRIDGE INTEGRATION CONTRACT (CANONICAL)

**Status:** LOCKED — SINGLE SOURCE OF TRUTH  
**Owner:** Bulldog  
**Last Updated:** 2026-01-16

---

## Domains

| Purpose | URL | Expected Response |
|---------|-----|-------------------|
| Frontend (HTML app) | `https://privxx.app` | HTML (React app) |
| Bridge API (JSON) | `https://api.privxx.app` | JSON |

⚠️ **Rule:** NEVER call API endpoints on `https://privxx.app` (that host returns HTML and will break health checks).

✅ **All API calls MUST go to `https://api.privxx.app`**

---

## Phase 1 Live Endpoints (Bridge)

### Public (NO JWT Required)

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/health` | `{"status":"ok","version":"0.4.0","xxdkReady":true\|false}` |

**UI Rule:** online/ready indicators must be derived from `/health` only (`xxdkReady` drives READY/STARTING).

---

### JWT Required (Supabase access_token)

All JWT-gated endpoints require:
```
Authorization: Bearer <Supabase access_token>
Content-Type: application/json
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Bridge status (returns `{"state":"idle"\|...}`) |
| POST | `/unlock` | Unlock identity session |
| POST | `/lock` | Lock identity session |
| POST | `/connect` | Initiate connection (envelope format required) |
| POST | `/disconnect` | Disconnect session |
| GET | `/unlock/status` | Get unlock status |

---

## Endpoint Details

### POST /unlock

**Request:**
```json
{
  "password": "<user password>"
}
```

**Response (200):**
```json
{
  "success": true,
  "expiresAt": "2026-01-16T12:00:00Z",
  "ttlSeconds": 900
}
```

**If session locked:** Other endpoints may return `403 {"code":"session_locked",...}`

---

### POST /connect

**IMPORTANT:** `/connect` uses an ENVELOPE message format. The correct request type is `connect_intent`.

**Request:**
```json
{
  "v": 1,
  "type": "connect_intent",
  "requestId": "<uuid>",
  "targetUrl": "https://example.com"
}
```

**Response:**
```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "<same uuid>",
  "ack": true,
  "status": "connected"
}
```

**Error Response:**
```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "<same uuid>",
  "ack": false,
  "errorCode": "INVALID_MESSAGE"
}
```

**Critical Notes:**
- ❌ `type: "connect"` will FAIL with `errorCode: "INVALID_MESSAGE"`
- ✅ `type: "connect_intent"` is required
- `requestId` is required (echoed back in `connect_ack`)
- Session must be unlocked first or `/connect` returns `403 session_locked`

---

## UI Status Rules (Phase 1)

1. **"API Online"** = `GET https://api.privxx.app/health` returns JSON 200
2. **Display:** `version` + `xxdkReady` (READY/STARTING)
3. **DO NOT** rely on `https://privxx.app/health` (returns HTML)

---

## Verified Routing (Cloudflared Ingress)

```
api.privxx.app  → http://127.0.0.1:8090  (privxx-bridge)
privxx.app      → http://127.0.0.1:3000  (frontend)
```

---

## Not Used (Frontend)

- ❌ Do NOT call `/cmixx/*` or `/xxdk/*` from frontend
- ❌ Any unlisted endpoint may 404 by design
- ❌ Admin endpoints (`/admin/*`) are NOT for frontend use

---

## Frontend Code Reference

### Canonical Health Hook

Location: `src/hooks/usePrivxxHealth.ts`

```tsx
import { useEffect, useState } from "react";

export type Health = {
  status: "ok";
  version: string;
  xxdkReady: boolean;
};

export function usePrivxxHealth(pollMs: number = 5000) {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        setError(null);
        const res = await fetch("https://api.privxx.app/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const txt = await res.text();
        let json: Health | null = null;
        try {
          json = txt ? (JSON.parse(txt) as Health) : null;
        } catch {
          json = null;
        }

        if (!res.ok || !json) throw new Error(`HTTP ${res.status}`);
        if (alive) setData(json);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Network error");
      }
    }

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return { data, error };
}
```

---

## PROD VPS Services (Reference)

| Service | Purpose |
|---------|---------|
| `privxx-backend.service` | xxDK owner, local-only |
| `privxx-bridge.service` | Public API via Cloudflare tunnel, listens 127.0.0.1:8090 |
| `cloudflared.service` | Tunnel routing api.privxx.app → 127.0.0.1:8090 |

---

## One-Liner Summary

> Use `https://api.privxx.app` for ALL API calls. `/connect` requires envelope format with `type: "connect_intent"`. Session must be unlocked first. UI "online/ready" derived from `/health` + `xxdkReady`.

---

*Privxx Team — Privacy-first by design*
