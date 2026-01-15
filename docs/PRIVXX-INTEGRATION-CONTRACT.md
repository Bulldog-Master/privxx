# PRIVXX — CANONICAL INTEGRATION CONTRACT (PHASE 1 LIVE / PHASE 2 NEXT)

**Status:** LOCKED — SINGLE SOURCE OF TRUTH  
**Owner:** Bulldog  
**Last Updated:** 2026-01-15

---

## Origins

| Purpose | URL |
|---------|-----|
| Frontend (Lovable/Cloudflare Pages) | `https://privxx.app` |
| API / Bridge (Cloudflare Tunnel → VPS) | `https://api.privxx.app` |

**Rule:** If it's not listed here, it does not exist. Assume 404/401 is correct unless listed otherwise.

---

## A) HOSTNAMES + ROUTING (LOCKED)

### 1) https://privxx.app
- **Purpose:** Frontend (Lovable/Cloudflare Pages)
- **Expected:** HTML (React app)

### 2) https://api.privxx.app
- **Purpose:** Privxx Bridge API (Cloudflare Tunnel → VPS localhost:8090)
- **Expected:** JSON for /health, auth-gated endpoints for Phase 2

### Cloudflare Tunnel Ingress (PROD VPS)
```
api.privxx.app  → http://127.0.0.1:8090  (privxx-bridge)
privxx.app      → http://127.0.0.1:3000  (frontend origin)
default         → 404
```

**IMPORTANT:**
- `/health` on `privxx.app` may return FRONTEND HTML (that's NORMAL if routed to frontend)
- API health checks MUST use: `https://api.privxx.app/health`

---

## B) PHASE 1 — LIVE API CONTRACT (WHAT EXISTS TODAY)

**Base URL:** `https://api.privxx.app`

### GET /health

```
200 OK
Content-Type: application/json

{"status":"ok","version":"0.4.0","xxdkReady":true}
```

- No auth required
- CORS allows Origin: `https://privxx.app`

### NOT EXPOSED (Phase 1)

These routes do not exist in Phase 1:

- `/`
- `/status`
- `/cmixx/*`
- `/xxdk/*`
- messaging routes

**Expected behavior:** 404 or 401 is normal for anything not listed above.

---

## C) FRONTEND RULES (LOVABLE MUST FOLLOW)

### 1) Base URL for ALL API calls
- ✅ `https://api.privxx.app`
- ❌ NEVER use `https://privxx.app` for API calls
  - `privxx.app` is frontend HTML; it can shadow `/health` and cause "bridge offline" false alarms

### 2) Phase 1 status checking
- ONLY call `GET /health`
- DO NOT call `/status` (it does not exist in Phase 1)

### 3) "Offline" UI logic
- If `/health` returns 200 JSON → API is ONLINE
- If fetch fails / non-JSON / non-200 → API OFFLINE
- `xxdkReady` true/false controls "Ready vs Starting" messaging (still "Online" if 200)

---

## D) FRONTEND SNIPPET — SHOW xxdkReady STATUS (PHASE 1)

```tsx
import { useEffect, useState } from "react";

type Health = { status: "ok"; version: string; xxdkReady: boolean };

export function usePrivxxHealth(pollMs = 5000) {
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
        const json = txt ? (JSON.parse(txt) as Health) : null;

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

export function XxdkReadyBadge() {
  const { data, error } = usePrivxxHealth(5000);

  if (error) return <span>API: OFFLINE</span>;
  if (!data) return <span>API: CHECKING…</span>;

  return (
    <span>
      API: OK · v{data.version} · xxDK: {data.xxdkReady ? "READY" : "STARTING"}
    </span>
  );
}
```

---

## E) PHASE 2 — PLANNED ENDPOINTS (DRAFT, NOT LIVE YET)

All Phase 2 endpoints REQUIRE Supabase JWT:

```
Authorization: Bearer <access_token>
```

### POST /session/unlock

**Request:**
```json
{"password":"…"}
```

**Response 200:**
```json
{"ok":true}
```

**Response 401/403:**
```json
{"ok":false,"error":"locked"|"invalid"|"expired"}
```

---

### POST /connect

**Request:**
```json
{"targetUrl":"https://example.com"}
```

**Response 200:**
```json
{"ok":true}
```

---

### GET /session/state

**Response 200:**
```json
{"state":"locked"|"unlocked"|"starting"|"error","detail?":"…"}
```

---

### GET /tunnel/status

**Response 200:**
```json
{"state":"idle"|"connecting"|"secure","latencyMs":123,"detail?":"…"}
```

---

### Still NOT AVAILABLE

- `/cmixx/*`
- `/xxdk/*`
- Any other routes: 404 expected

---

## F) PROD VPS SERVICES (REFERENCE)

On PRIVXX (prod VPS):

| Service | Purpose |
|---------|---------|
| `privxx-backend.service` | xxDK owner, local-only |
| `privxx-bridge.service` | Public API via Cloudflare tunnel, listens 127.0.0.1:8090 |
| `cloudflared.service` | Tunnel routing api.privxx.app → 127.0.0.1:8090 |

---

## G) ONE COMMAND QUICKCHECK (PROD VPS)

Run on PRIVXX (prod VPS) when troubleshooting:

```bash
bash -lc '
set -euo pipefail
echo "=== PRIVXX QUICKCHECK (PROD) ==="
date -u +"UTC: %Y-%m-%dT%H:%M:%SZ"
echo

echo "-- services --"
sudo systemctl is-active privxx-backend privxx-bridge cloudflared || true
echo

echo "-- local API /health (must be JSON) --"
curl -sS -i http://127.0.0.1:8090/health | sed -n "1,12p" || true
echo

echo "-- public API /health (must be JSON) --"
curl -sS -i https://api.privxx.app/health | sed -n "1,12p" || true
echo

echo "-- frontend root (must be HTML) --"
curl -sS -i https://privxx.app/ | sed -n "1,12p" || true
'
```

---

## H) SUMMARY FOR LOVABLE

> "Frontend must treat https://privxx.app as HTML-only and use https://api.privxx.app for all API calls; Phase 1 only supports GET /health (no /status), and online/ready state must be derived solely from /health + xxdkReady."

---

*Privxx Team — Privacy-first by design*
