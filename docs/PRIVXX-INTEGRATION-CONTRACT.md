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

### JWT Required (Supabase access_token)

All JWT-gated endpoints require:
```
Authorization: Bearer <Supabase access_token>
Content-Type: application/json
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Bridge status (returns `{"state":"idle"\|...}`) |
| POST | `/connect` | Initiate connection (see Known Gotchas) |
| POST | `/disconnect` | Disconnect session |
| POST | `/lock` | Lock identity session |
| POST | `/unlock` | Unlock identity session |
| GET | `/unlock/status` | Get unlock status |

### Admin (NOT for frontend)

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/admin/reset-ratelimit` | Requires admin secret; may be disabled |

---

## UI Status Rules (Phase 1)

1. **"API Online"** = `GET https://api.privxx.app/health` returns JSON 200
2. **Display:** `version` + `xxdkReady` (READY/STARTING)
3. **DO NOT** rely on `https://privxx.app/health` (returns HTML)

---

## Known Gotchas

### /connect Request Schema

- `/connect` does **NOT** accept `{"targetUrl":"..."}` in current build (returns `INVALID_MESSAGE`)
- Frontend must follow the exact `/connect` request schema implemented in the bridge binary
- **Action:** Requires discovery from bridge binary/source for correct envelope format

---

## Verified Routing (Cloudflared Ingress)

```
api.privxx.app  → http://127.0.0.1:8090  (privxx-bridge)
privxx.app      → http://127.0.0.1:3000  (frontend)
```

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

> Use `https://api.privxx.app` for ALL API calls. Phase 1 supports public `GET /health` plus JWT-gated endpoints (`/status`, `/connect`, `/disconnect`, `/lock`, `/unlock`, `/unlock/status`). UI "online/ready" must be derived solely from `/health` + `xxdkReady`.

---

*Privxx Team — Privacy-first by design*
