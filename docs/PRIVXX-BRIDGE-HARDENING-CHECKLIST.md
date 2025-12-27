# Privxx Bridge Hardening Checklist (C2 Production Model)

**Status:** Ready for Implementation  
**Last Updated:** 2025-12-27  
**Audience:** Backend Team

---

## Overview

This document defines the security hardening requirements for the Privxx Bridge under the C2 production architecture. The bridge acts as the authenticated gateway between the frontend and xxDK/cMixx backend.

### Architecture Summary

```
Frontend (React) → Bridge (Go) → xxDK → cMixx Mixnet
     ↓                ↓
  Supabase         Identity
    JWT            Storage
```

---

## 1. JWT Verification

### Requirements

| Requirement | Priority | Status |
|-------------|----------|--------|
| Validate JWT on every request | CRITICAL | ☐ |
| Verify JWT signature using Supabase public key | CRITICAL | ☐ |
| Check `exp` claim (expiration) | CRITICAL | ☐ |
| Check `aud` claim matches expected audience | HIGH | ☐ |
| Check `iss` claim matches Supabase project | HIGH | ☐ |
| Extract `sub` claim as `user_id` | CRITICAL | ☐ |
| Reject expired/malformed tokens with 401 | CRITICAL | ☐ |
| Log failed auth attempts (no sensitive data) | MEDIUM | ☐ |

### Implementation Notes

```go
// Expected header format
Authorization: Bearer <JWT>

// JWT claims to validate
{
  "sub": "user-uuid",           // user_id - extract this
  "aud": "authenticated",       // must match
  "exp": 1234567890,            // must be in future
  "iss": "https://<project>.supabase.co/auth/v1"
}
```

### Supabase JWT Public Key

Fetch from: `https://<project-id>.supabase.co/rest/v1/rpc/get_jwt_secret`

Or configure via environment variable:
```
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Error Responses

```json
// 401 Unauthorized - Missing or invalid token
{ "error": "unauthorized", "message": "Invalid or expired token" }

// 403 Forbidden - Valid token but no access
{ "error": "forbidden", "message": "Access denied" }
```

---

## 2. Identity Mapping

### Requirements

| Requirement | Priority | Status |
|-------------|----------|--------|
| Map `user_id` (JWT sub) to XX identity | CRITICAL | ☐ |
| Store mapping persistently | CRITICAL | ☐ |
| One user = one XX identity | HIGH | ☐ |
| Support identity creation on first auth | HIGH | ☐ |
| Prevent identity hijacking | CRITICAL | ☐ |
| Allow multiple sessions per identity | MEDIUM | ☐ |

### Identity Lifecycle

```
1. User authenticates (JWT validated)
2. Bridge checks: does user_id have an XX identity?
   - NO  → Return state: "none"
   - YES → Return state: "locked" or "unlocked"
3. User calls /identity/create → Generate XX identity, map to user_id
4. User calls /identity/unlock → Re-auth validated, unlock identity
5. User calls /identity/lock → Lock identity, clear session
```

### Storage Schema (Example)

```sql
CREATE TABLE identity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,           -- Supabase user ID
  xx_identity_id TEXT NOT NULL UNIQUE,    -- XX Network identity
  created_at TIMESTAMPTZ DEFAULT now(),
  last_unlocked_at TIMESTAMPTZ,
  unlock_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_identity_user ON identity_mappings(user_id);
```

### Security Considerations

- **Never** expose XX identity IDs to the frontend
- **Never** allow user A to access user B's identity
- Validate `user_id` from JWT on every identity operation
- Log identity operations for audit trail

---

## 3. Unlock TTL Enforcement

### Requirements

| Requirement | Priority | Status |
|-------------|----------|--------|
| Unlock sessions have configurable TTL | CRITICAL | ☐ |
| Default TTL: 15 minutes | HIGH | ☐ |
| Return `expiresAt` timestamp on unlock | CRITICAL | ☐ |
| Auto-lock when TTL expires | CRITICAL | ☐ |
| Reject operations on expired sessions | CRITICAL | ☐ |
| Allow session extension via re-unlock | HIGH | ☐ |
| Support concurrent sessions (cross-device) | MEDIUM | ☐ |

### Unlock Flow

```
POST /identity/unlock
Authorization: Bearer <JWT>

1. Validate JWT → extract user_id
2. Find identity for user_id
3. Set unlock_expires_at = now() + TTL
4. Return { state: "unlocked", expiresAt: "2025-12-27T12:30:00Z" }
```

### Session Check (on every protected operation)

```go
func isUnlocked(userID string) bool {
    identity := findIdentity(userID)
    if identity == nil {
        return false
    }
    if identity.UnlockExpiresAt == nil {
        return false
    }
    return time.Now().Before(*identity.UnlockExpiresAt)
}
```

### Protected Endpoints

These endpoints MUST verify unlock status:

| Endpoint | Requires Unlock |
|----------|-----------------|
| `GET /identity/status` | No |
| `POST /identity/create` | No |
| `POST /identity/unlock` | No |
| `POST /identity/lock` | No |
| `POST /messages/send` | **YES** |
| `GET /messages/inbox` | **YES** |

### Error Response for Expired Session

```json
// 403 Forbidden - Session expired
{ 
  "error": "session_expired", 
  "message": "Identity session has expired. Please unlock again."
}
```

---

## 4. Endpoint Security Summary

### Authentication Matrix

| Endpoint | Auth Required | Unlock Required |
|----------|---------------|-----------------|
| `GET /health` | No | No |
| `GET /status` | Yes (JWT) | No |
| `POST /auth/session` | Yes (JWT) | No |
| `GET /identity/status` | Yes (JWT) | No |
| `POST /identity/create` | Yes (JWT) | No |
| `POST /identity/unlock` | Yes (JWT) | No |
| `POST /identity/lock` | Yes (JWT) | No |
| `POST /messages/send` | Yes (JWT) | **Yes** |
| `GET /messages/inbox` | Yes (JWT) | **Yes** |

---

## 5. Logging & Monitoring

### What to Log

| Event | Log Level | Include |
|-------|-----------|---------|
| Auth success | INFO | user_id, timestamp |
| Auth failure | WARN | reason, IP (hashed), timestamp |
| Identity created | INFO | user_id, timestamp |
| Identity unlocked | INFO | user_id, TTL, timestamp |
| Identity locked | INFO | user_id, timestamp |
| Session expired | INFO | user_id, timestamp |
| Message sent | DEBUG | user_id, recipient (hashed), timestamp |

### What NOT to Log

- JWT tokens (full or partial)
- Message content
- XX identity private keys
- IP addresses in plaintext
- Any PII beyond user_id

---

## 6. Configuration

### Environment Variables

```bash
# Required
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_PROJECT_ID=your-project-id

# Optional (with defaults)
UNLOCK_TTL_MINUTES=15
MAX_SESSIONS_PER_USER=5
LOG_LEVEL=info

# xxDK Configuration
XXDK_STATE_DIR=/var/lib/privxx/xxdk
XXDK_NDF_PATH=/etc/privxx/ndf.json
```

---

## 7. Testing Checklist

### Unit Tests

- [ ] JWT validation with valid token
- [ ] JWT validation with expired token
- [ ] JWT validation with wrong signature
- [ ] JWT validation with missing claims
- [ ] Identity creation for new user
- [ ] Identity lookup for existing user
- [ ] Unlock with valid JWT
- [ ] Unlock TTL enforcement
- [ ] Auto-lock after TTL expiry
- [ ] Message send with valid unlock
- [ ] Message send with expired unlock

### Integration Tests

- [ ] Full auth flow: Supabase login → bridge auth → identity unlock
- [ ] Cross-device session (two clients, same user)
- [ ] Session isolation (two users cannot access each other)
- [ ] Concurrent message operations

### Security Tests

- [ ] Token replay attack prevention
- [ ] Session fixation prevention
- [ ] Identity enumeration prevention
- [ ] Rate limiting on auth endpoints

---

## 8. Rollout Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security review completed
- [ ] JWT secret configured in production
- [ ] Logging configured (no sensitive data)
- [ ] Monitoring dashboards ready

### Deployment

- [ ] Deploy to staging environment
- [ ] Smoke test all endpoints
- [ ] Verify JWT validation works
- [ ] Verify identity mapping works
- [ ] Verify TTL enforcement works
- [ ] Deploy to production
- [ ] Monitor error rates for 24h

### Post-Deployment

- [ ] Verify no auth errors in logs
- [ ] Verify session expiry working correctly
- [ ] Confirm cross-device sessions work
- [ ] Document any issues found

---

## 9. References

- [Supabase JWT Documentation](https://supabase.com/docs/guides/auth/jwts)
- [XX Network xxDK Documentation](https://xxnetwork.wiki/)
- [Privxx Architecture Spec](./PRIVXX-ARCHITECTURE-SPEC.md)
- [Privxx C2 Model](./PRIVXX-C2-PRODUCTION-MODEL.md)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-27 | Privxx Team | Initial hardening checklist |
