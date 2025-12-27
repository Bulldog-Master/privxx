# Privxx Canonical Origin Configuration

**Canonical Origin:** `https://privxx.app`  
**Last Updated:** 2025-12-27  
**Status:** LOCKED

---

## Overview

Privxx enforces a single canonical origin for all production traffic. This eliminates:
- CORS confusion between multiple domains
- Mixed-origin security issues
- Inconsistent browser behavior (especially Safari)
- Debugging complexity from multiple entry points

---

## Origin Rules

### Production
| URL | Behavior |
|-----|----------|
| `https://privxx.app` | ✅ Canonical origin |
| `https://www.privxx.app` | 🔄 Redirect to canonical |
| `http://privxx.app` | 🔄 Redirect to HTTPS canonical |
| `http://www.privxx.app` | 🔄 Redirect to HTTPS canonical |

### Development
| URL | Behavior |
|-----|----------|
| `http://localhost:8080` | ✅ Allowed (dev mode) |
| `https://*.lovable.app` | ✅ Allowed (preview) |
| `https://*.lovableproject.com` | ✅ Allowed (preview) |

---

## CORS Configuration

### Edge Functions
```typescript
// supabase/functions/_shared/cors.ts

const ALLOWED_ORIGINS = [
  'https://privxx.app',
  'https://www.privxx.app',
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
];
```

### Bridge API
The bridge server should enforce:
```
Access-Control-Allow-Origin: https://privxx.app
Access-Control-Allow-Credentials: true
Vary: Origin
```

---

## Frontend Configuration

### Bridge URL Resolution
```typescript
// src/api/bridge/index.ts

const CANONICAL_BRIDGE_URL = "https://privxx.app/api/bridge";

// Priority:
// 1. VITE_BRIDGE_URL environment variable
// 2. Canonical URL if on production origin
// 3. Mock client for development
```

### Auth Redirects
All auth redirects use `window.location.origin`:
- Signup email confirmation
- Magic link login
- Password reset

This ensures redirects work correctly on both canonical and preview origins.

---

## Cloudflare Configuration

### DNS Records
```
Type  | Name | Value           | Proxy
------|------|-----------------|------
A     | @    | 185.158.133.1   | Yes
A     | www  | 185.158.133.1   | Yes
```

### Page Rules (Recommended)
```
# Force HTTPS
https://privxx.app/* → Always Use HTTPS

# www redirect
https://www.privxx.app/* → 301 Redirect to https://privxx.app/$1
```

### Tunnel Routes
```yaml
# cloudflared config
ingress:
  - hostname: privxx.app
    service: http://127.0.0.1:8090
  - hostname: www.privxx.app
    service: http://127.0.0.1:8090
  - service: http_status:404
```

---

## Bridge Server Configuration

The bridge (Go) should validate origin:

```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")
        
        if isAllowedOrigin(origin) {
            w.Header().Set("Access-Control-Allow-Origin", origin)
            w.Header().Set("Access-Control-Allow-Credentials", "true")
            w.Header().Set("Vary", "Origin")
        }
        
        w.Header().Set("Access-Control-Allow-Headers", 
            "Authorization, Content-Type, X-Correlation-Id")
        w.Header().Set("Access-Control-Allow-Methods", 
            "GET, POST, OPTIONS")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}

func isAllowedOrigin(origin string) bool {
    allowed := []string{
        "https://privxx.app",
        "https://www.privxx.app",
    }
    
    for _, a := range allowed {
        if origin == a {
            return true
        }
    }
    
    // Allow Lovable preview domains
    if strings.HasSuffix(origin, ".lovable.app") ||
       strings.HasSuffix(origin, ".lovableproject.com") {
        return true
    }
    
    return false
}
```

---

## Verification Checklist

### DNS
- [ ] `dig privxx.app` returns correct IP
- [ ] `dig www.privxx.app` returns correct IP

### HTTPS
- [ ] `curl -I https://privxx.app` returns 200
- [ ] `curl -I http://privxx.app` returns 301 → https

### www Redirect
- [ ] `curl -I https://www.privxx.app` returns 301 → canonical

### CORS
- [ ] Preflight from `https://privxx.app` returns correct headers
- [ ] Preflight from unauthorized origin is rejected

### Bridge
- [ ] `https://privxx.app/api/bridge/health` returns OK
- [ ] CORS headers present on response

---

## Troubleshooting

### "CORS error" in browser console
1. Check origin header is being sent
2. Verify bridge returns `Access-Control-Allow-Origin`
3. Check for `Vary: Origin` header
4. Ensure credentials mode matches

### "Blocked by CORS policy"
1. Origin not in allowed list
2. Missing `Access-Control-Allow-Credentials` for auth requests
3. Preflight (OPTIONS) not handled

### Safari-specific issues
1. Safari is strict about mixed content
2. Ensure all resources load from HTTPS
3. Check for cookie partitioning issues

---

*This configuration is LOCKED. Changes require security review.*
