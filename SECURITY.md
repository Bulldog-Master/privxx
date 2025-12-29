# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Privxx, please report it responsibly.

- Do NOT open a public GitHub issue.
- Send details to the project maintainer via direct message or private email.

Please include:
- A clear description of the issue
- Steps to reproduce (if applicable)
- Potential impact

We appreciate responsible disclosure and will address issues as quickly as possible.

## Scope

This repository currently contains:
- UI prototype
- Demo-mode logic
- Planned (but not yet integrated) cMixx networking components

Cryptographic routing and live privacy guarantees are not yet active.

---

## Security Architecture

Privxx implements a multi-layered security model following OWASP best practices and ISO 27001/27701 compliance standards.

### Authentication Security

#### Passkey (WebAuthn) Authentication

Privxx uses the WebAuthn standard with `@simplewebauthn/server` for cryptographic verification:

| Security Feature | Implementation |
|-----------------|----------------|
| Challenge Verification | Server-generated challenges validated against stored values |
| Origin Verification | Requests validated against allowed origins list |
| RP ID Validation | Relying Party ID verified to prevent phishing |
| Counter Replay Protection | Authenticator counters tracked to detect cloned keys |
| Signature Verification | Cryptographic signatures verified using stored public keys |

#### TOTP (Time-based One-Time Password) Authentication

| Security Feature | Implementation |
|-----------------|----------------|
| Constant-Time Comparison | All code comparisons use timing-safe algorithms |
| Replay Attack Prevention | Used counters tracked with 60-second reuse window |
| Strict Input Validation | Codes validated as exactly 6 numeric digits |
| SHA-256 Backup Code Hashing | Backup codes stored as irreversible hashes |

---

## Rate Limiting & Brute-Force Protection

### Overview

Privxx implements comprehensive rate limiting and brute-force protection across all authentication endpoints. These protections operate at multiple layers to prevent automated attacks while maintaining usability for legitimate users.

### Rate Limiting Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `RATE_LIMIT_WINDOW_MS` | 60,000 ms (1 minute) | Time window for counting requests |
| `MAX_REQUESTS_PER_WINDOW` | 10 requests | Maximum requests before lockout |
| `LOCKOUT_DURATION_MS` | 900,000 ms (15 minutes) | Lockout duration after exceeding limit |

### Endpoint-Specific Protections

#### Passkey Authentication (`passkey-auth`)

```
Rate Limit: 10 requests/minute per IP+email combination
Lockout: 15 minutes after exceeding rate limit
Identifier: {client_ip}_{user_email}
```

**Actions Protected:**
- `registration-options` — Passkey registration initiation
- `registration-verify` — Passkey registration completion
- `authentication-options` — Passkey login initiation
- `authentication-verify` — Passkey login completion

#### TOTP Authentication (`totp-auth`)

```
Rate Limit: 10 requests/minute per IP+user combination
Lockout: 15 minutes after exceeding rate limit
Failed Attempt Lockout: 5 failed attempts → 15 minute lockout
Identifier: {client_ip}_{user_id}
```

**Actions Protected:**
- `setup` — TOTP enrollment
- `verify` — Code verification
- `disable` — 2FA removal
- `backup-codes` — Backup code regeneration
- `verify-backup` — Backup code verification

### Rate Limiting Implementation

#### Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Incoming Request                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Extract Client IP + Identifier                 │
│   (X-Forwarded-For → X-Real-IP → fallback to 'unknown')    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Check rate_limits Table                      │
│   SELECT * FROM rate_limits                                 │
│   WHERE identifier = ? AND action = ?                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Entry Exists?         │     │   No Entry?             │
│   Check locked_until    │     │   Create new entry      │
│   Check attempt count   │     │   attempts = 1          │
└─────────────────────────┘     └─────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Decision Matrix                          │
├─────────────────────────────────────────────────────────────┤
│ locked_until > now        → DENY (429 Too Many Requests)   │
│ attempts >= max_requests  → LOCK + DENY                     │
│ window expired            → RESET attempts to 1            │
│ within window             → INCREMENT attempts             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Allow or Deny Request                     │
└─────────────────────────────────────────────────────────────┘
```

### TOTP-Specific Brute-Force Protection

TOTP verification includes an additional layer of brute-force protection that tracks failed attempts per user:

```
┌─────────────────────────────────────────────────────────────┐
│                    TOTP Verification                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Check totp_secrets.locked_until                │
│              Check totp_secrets.failed_attempts             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Verification Failed   │     │   Verification Success  │
│   INCREMENT attempts    │     │   RESET attempts to 0   │
│   if >= 5: LOCK 15 min  │     │   CLEAR locked_until    │
└─────────────────────────┘     └─────────────────────────┘
```

### Database Schema

Rate limiting data is stored in the `rate_limits` table:

```sql
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,        -- IP + user identifier
  action TEXT NOT NULL,            -- Action being rate-limited
  attempts INTEGER DEFAULT 1,       -- Request count in current window
  first_attempt_at TIMESTAMPTZ,    -- Window start time
  last_attempt_at TIMESTAMPTZ,     -- Most recent request
  locked_until TIMESTAMPTZ         -- Lockout expiry (null if not locked)
);
```

TOTP-specific tracking in `totp_secrets` table:

```sql
-- Added columns for brute-force protection
failed_attempts INTEGER DEFAULT 0,
locked_until TIMESTAMPTZ,
last_used_counter BIGINT,          -- Replay attack prevention
last_used_at TIMESTAMPTZ           -- Replay attack prevention
```

### Security Considerations

#### Timing Attack Prevention

All authentication endpoints use constant-time comparison algorithms:

```typescript
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Maintain constant time even for different lengths
    let result = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      result |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

#### User Enumeration Prevention

- Passkey authentication returns identical error messages for "user not found" and "no passkeys registered"
- Random delays (100-200ms) added to authentication responses
- Generic error messages exposed to clients; detailed errors logged server-side

#### Replay Attack Prevention

- WebAuthn: Authenticator counters validated and tracked
- TOTP: Used counters tracked with 60-second reuse prevention window
- Challenges: Single-use with 5-minute expiration

### Row-Level Security (RLS)

All security-sensitive tables have RLS enabled with restrictive policies:

| Table | Policy |
|-------|--------|
| `rate_limits` | Deny all client access (service_role only) |
| `totp_secrets` | User can view own status only |
| `totp_backup_codes` | Deny all client access (service_role only) |
| `passkey_credentials` | User can view/manage own credentials |
| `passkey_challenges` | Deny all client access (service_role only) |

### Response Headers

Rate-limited responses include standard headers:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 900

{"error": "Too many requests. Please try again later."}
```

---

## Security Checklist

### Authentication Endpoints

- [x] Rate limiting on all auth actions
- [x] Brute-force lockouts after failed attempts
- [x] Constant-time comparison for secrets
- [x] Timing attack prevention with random delays
- [x] User enumeration prevention
- [x] Replay attack prevention
- [x] Challenge expiration (5 minutes)
- [x] Generic client error messages

### Database Security

- [x] RLS enabled on all tables
- [x] Restrictive policies for sensitive data
- [x] Service-role only access for rate limits
- [x] Hashed backup codes (SHA-256)

### Edge Function Security

- [x] CORS restricted to allowed origins
- [x] JWT verification on authenticated endpoints
- [x] Input validation and sanitization
- [x] Server-side logging of security events

---

## Compliance

Privxx security measures are designed to support:

- **ISO 27001** — Information Security Management
- **ISO 27701** — Privacy Information Management
- **OWASP** — Authentication and session management best practices

---

## Monitoring & Alerting

Security events are logged server-side for monitoring:

```
[passkey-auth] Rate limit exceeded for: {identifier}
[passkey-auth] Authentication successful with cryptographic verification for: {email}
[totp-auth] Account locked for user: {userId} after {attempts} failed attempts
[totp-auth] Replay attack detected for: {email}
[totp-auth] Backup code used with constant-time verification for: {email}
```

These logs can be integrated with monitoring systems for real-time alerting on suspicious activity patterns.