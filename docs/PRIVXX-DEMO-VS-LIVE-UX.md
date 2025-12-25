# 🔒 PRIVXX DEMO VS LIVE UX RULES — LOCKED

**Status:** ACTIVE  
**Audience:** Frontend Devs / QA / Design  
**Purpose:** Define how UI behaves in mock mode vs live backend

---

## MODES

| Mode | Trigger | Backend Calls |
|------|---------|---------------|
| **Demo** | `VITE_USE_MOCKS=true` OR default | Mocked locally |
| **Live** | `VITE_USE_MOCKS=false` AND edge functions deployed | Real `/api/backend/*` |

---

## GLOBAL INDICATOR RULES

### Demo Mode

**Always show:**
- "(Demo)" suffix on backend health indicator
- "Network initializing..." or similar neutral language
- No error states for simulated failures

**Never show:**
- "Connected to XX Network" (misleading)
- Real latency numbers
- Fake success confirmations for send actions

### Live Mode

**Show based on actual state:**
- Real backend status (`starting`, `ready`, `error`)
- Actual latency/performance metrics
- Real error messages (sanitized, no internal details)

---

## COMPONENT-SPECIFIC RULES

### BackendHealthIndicator

| State | Demo Mode | Live Mode |
|-------|-----------|-----------|
| Loading | "Checking... (Demo)" | "Checking..." |
| Ready | "Backend Live (Demo)" | "Backend Live" |
| Error | "Offline (Demo)" | "Backend Unavailable" + retry |
| Starting | "Connecting... (Demo)" | "Connecting..." |

### ConnectionCard

| State | Demo Mode | Live Mode |
|-------|-----------|-----------|
| Idle | Show normal UI | Show normal UI |
| Connecting | Simulate 2-3s delay | Real delay |
| Connected | Show simulated session ID | Show real session ID |
| Error | "Simulated error" | Real error (sanitized) |

### PrivacyDrawer

No mode-specific behavior. Always shows static privacy information.

---

## MESSAGING RULES

### Demo Mode Copy

✅ **DO:**
- "Demo mode — network initializing"
- "Simulated connection"
- "Preview of Privxx experience"

❌ **DON'T:**
- "Connected to cMixx"
- "Your data is protected" (misleading in demo)
- "Message sent successfully" (for mocked sends)

### Live Mode Copy

✅ **DO:**
- "Connected via cMixx"
- "Message queued"
- Real status messages

❌ **DON'T:**
- Expose internal errors
- Show gateway/node info
- Display version numbers

---

## ERROR HANDLING

### Demo Mode

```
User action → Simulated delay → Mock success/failure
```

- Errors are synthetic
- No retry logic needed
- Toast: "Demo: [action] simulated"

### Live Mode

```
User action → Real API call → Handle response
```

- Implement proper error boundaries
- Retry with exponential backoff
- Toast: Real error message (sanitized)

---

## VISUAL DIFFERENTIATION

### Option A: Subtle Badge (Recommended)

```tsx
// In BackendHealthIndicator
const modeLabel = isMockMode() ? ' (Demo)' : '';
<span>{t('backendLive')}{modeLabel}</span>
```

### Option B: Banner (For Staging)

```tsx
{isMockMode() && (
  <div className="bg-amber-500/10 text-amber-500 text-xs py-1 px-2 text-center">
    Demo Mode — Backend simulated
  </div>
)}
```

### Option C: No Indicator (Not Recommended)

Only acceptable if demo mode is extremely temporary.

---

## TRANSITION CHECKLIST

When switching from Demo → Live:

- [ ] Set `VITE_USE_MOCKS=false`
- [ ] Verify edge functions deployed
- [ ] Verify `/api/backend/health` returns real data
- [ ] Remove "(Demo)" suffix automatically (code handles this)
- [ ] Test all user flows with real backend
- [ ] Verify error states work correctly
- [ ] Check latency is acceptable

---

## CODE REFERENCE

### Check Mode
```typescript
import { isMockMode } from '@/lib/privxx-api';

if (isMockMode()) {
  // Demo behavior
} else {
  // Live behavior
}
```

### API Client
```typescript
// src/lib/privxx-api.ts
const MOCK_MODE = import.meta.env.VITE_USE_MOCKS === "true" || true;
```

---

## NEVER DO

- ❌ Show "real" success for mocked operations
- ❌ Hide demo mode from users
- ❌ Use different UI components for demo vs live
- ❌ Store mode preference in localStorage
- ❌ Allow users to toggle mode (dev-only setting)

---

*END OF DOCUMENT*
