# 🔧 PRIVXX EDGE FUNCTION PROXY SPEC

**Status:** READY FOR IMPLEMENTATION (when backend is stable)  
**Last Updated:** 2025-12-25  
**Audience:** Proxy Implementer / Lovable Cloud

---

## PURPOSE

This document specifies the edge functions that bridge the frontend UI to the real backend at `https://privxx.app`.

The proxy layer:
- Isolates the browser from backend instability
- Transforms internal responses to UI-safe formats
- Enforces privacy boundaries
- Enables mock-to-live transition without frontend changes

---

## ARCHITECTURE REMINDER

```
Browser (React UI)
       ↓
/api/backend/* (same-origin)
       ↓
Edge Function (Lovable Cloud / Supabase)
       ↓
https://privxx.app (real backend via Cloudflare Tunnel)
```

---

## EDGE FUNCTIONS TO CREATE

| Edge Function | Proxy Endpoint | Real Backend Endpoint |
|---------------|----------------|----------------------|
| `backend-health` | `/api/backend/health` | `https://privxx.app/cmixx/status` |
| `backend-status` | `/api/backend/status` | `https://privxx.app/cmixx/status` |
| `backend-messages` | `/api/backend/messages` | `https://privxx.app/cmixx/inbox` |
| `backend-send` | `/api/backend/send` | `https://privxx.app/cmixx/send` |

---

## FUNCTION SPECIFICATIONS

### 1. backend-health

**Purpose:** Simple health check

**Request:** `GET /api/backend/health`

**Backend Call:** `GET https://privxx.app/cmixx/status`

**Transform Logic:**
```
IF backend responds with any 2xx status
  → { "ok": true }
ELSE
  → { "ok": false }
```

**Response:**
```json
{ "ok": true }
```

**Timeout:** 3 seconds

---

### 2. backend-status

**Purpose:** Connection state for UI indicators

**Request:** `GET /api/backend/status`

**Backend Call:** `GET https://privxx.app/cmixx/status`

**Backend Response (raw):**
```json
{
  "ready": true,
  "phase": "running",
  "uptime": 12345,
  ...
}
```

**Transform Logic:**
```
IF backend.ready === true AND backend.phase === "running"
  → { "state": "ready" }
ELSE IF backend.ready === false
  → { "state": "starting", "detail": "Initializing..." }
ELSE IF network error OR timeout
  → { "state": "error", "detail": "Backend unavailable" }
```

**Response:**
```json
{
  "state": "starting" | "ready" | "error",
  "detail": "optional string"
}
```

**Timeout:** 5 seconds

**Privacy Rules:**
- NEVER pass through: `uptime`, `version`, `phase`, internal fields
- ONLY return: `state`, `detail`

---

### 3. backend-messages

**Purpose:** Fetch inbox messages

**Request:** `GET /api/backend/messages`

**Backend Call:** `GET https://privxx.app/cmixx/inbox`

**Backend Response (raw):**
```json
{
  "messages": [
    {
      "id": "...",
      "sender": "...",
      "payload": "...",
      "receivedAt": 1234567890
    }
  ]
}
```

**Transform Logic:**
```
Map each message:
  - id → id
  - sender → from
  - payload → body
  - receivedAt → timestamp

IF network error OR timeout
  → { "messages": [] }
```

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "from": "string",
      "body": "string",
      "timestamp": number
    }
  ]
}
```

**Timeout:** 5 seconds

---

### 4. backend-send

**Purpose:** Queue outbound message

**Request:** `POST /api/backend/send`

**Request Body:**
```json
{
  "recipient": "string",
  "message": "string"
}
```

**Backend Call:** `POST https://privxx.app/cmixx/send`

**Backend Behavior:**
- Currently returns `501 Not Implemented`
- Will return `{ "messageId": "...", "queued": true }` when enabled

**Transform Logic:**
```
IF backend returns 501
  → { "error": "Send not available yet", "queued": false }
IF backend returns 2xx with messageId
  → { "messageId": "...", "queued": true }
IF network error
  → { "error": "Backend unavailable", "queued": false }
```

**Response (success):**
```json
{
  "messageId": "string",
  "queued": true
}
```

**Response (not ready):**
```json
{
  "error": "Send not available yet",
  "queued": false
}
```

**Timeout:** 5 seconds

---

## IMPLEMENTATION TEMPLATE

Each edge function follows this structure:

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BACKEND_URL = Deno.env.get('PRIVXX_BACKEND_URL') || 'https://privxx.app';
const TIMEOUT_MS = 5000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${BACKEND_URL}/cmixx/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Backend ${response.status}`);
    }

    const data = await response.json();
    
    // TRANSFORM: Backend response → UI-safe response
    const uiResponse = {
      state: data.ready && data.phase === 'running' ? 'ready' : 'starting',
    };

    return new Response(JSON.stringify(uiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // NEVER expose internal error details
    return new Response(JSON.stringify({ 
      state: 'error', 
      detail: 'Backend unavailable' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## SECRETS REQUIRED

| Secret Name | Description |
|-------------|-------------|
| `PRIVXX_BACKEND_URL` | Base URL for backend (default: `https://privxx.app`) |

**Note:** No API keys required — backend is public but proxied for architecture reasons.

---

## DEPLOYMENT CHECKLIST

- [ ] Enable Lovable Cloud
- [ ] Create `backend-health` edge function
- [ ] Create `backend-status` edge function
- [ ] Create `backend-messages` edge function
- [ ] Create `backend-send` edge function
- [ ] Add `PRIVXX_BACKEND_URL` secret (optional, has default)
- [ ] Update `supabase/config.toml` with `verify_jwt = false` for all functions
- [ ] Test each endpoint manually
- [ ] Set `MOCK_MODE = false` in `src/lib/privxx-api.ts`
- [ ] Verify frontend works end-to-end

---

## PRIVACY ENFORCEMENT (CRITICAL)

### NEVER pass through:
- `uptime`
- `version`
- `phase`
- `ready` (boolean — transform to state string)
- Gateway/node identifiers
- NDF sources
- xxdk internals
- Stack traces
- Internal error messages

### ALWAYS return:
- Generic state strings: `"starting"`, `"ready"`, `"error"`
- User-safe detail messages
- Transformed/sanitized data only

---

## TESTING

### Manual curl tests:

```bash
# Health check
curl https://your-project.supabase.co/functions/v1/backend-health

# Status
curl https://your-project.supabase.co/functions/v1/backend-status

# Messages
curl https://your-project.supabase.co/functions/v1/backend-messages

# Send (POST)
curl -X POST https://your-project.supabase.co/functions/v1/backend-send \
  -H "Content-Type: application/json" \
  -d '{"recipient": "test-id", "message": "Hello"}'
```

---

## FRONTEND INTEGRATION

Once edge functions are deployed:

1. Update `src/lib/privxx-api.ts`:
   - Change `MOCK_MODE = false`
   - Endpoints already point to `/api/backend/*`

2. Verify Vite proxy or Supabase function routing maps correctly

3. Test:
   - Status indicator shows "Live" (not "Demo")
   - Messages load from real inbox
   - Send shows appropriate "not ready" message

---

## NOTES FOR IMPLEMENTER

- Backend may be slow (3-5s) during mixnet operations — timeouts are intentional
- 501 on `/cmixx/send` is expected until messaging is enabled
- Inbox may be empty — this is normal
- If backend is down, always return graceful error states
- Log errors server-side for debugging, but never expose to UI

---

*END OF SPEC*
