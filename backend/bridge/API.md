# Privxx Bridge API Documentation

**Version:** 0.4.0  
**Base URL:** `http://localhost:8090` (default)

The Privxx Bridge is a local companion service that wraps xxDK functionality and exposes HTTP endpoints for the Privxx UI. It handles authentication, identity management, and session lifecycle.

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Identity Session Management](#identity-session-management)
5. [Endpoints](#endpoints)
   - [GET /health](#get-health)
   - [POST /unlock](#post-unlock)
   - [GET /unlock/status](#get-unlockstatus)
   - [POST /lock](#post-lock)
   - [POST /connect](#post-connect)
   - [GET /status](#get-status)
   - [POST /disconnect](#post-disconnect)
6. [Error Responses](#error-responses)
7. [Configuration](#configuration)
8. [CORS Policy](#cors-policy)

---

## Security Overview

The bridge implements multiple security layers:

| Layer | Description |
|-------|-------------|
| **JWT Authentication** | HMAC-SHA256 signature verification using Supabase JWT secret |
| **Rate Limiting** | IP-based protection against brute-force attacks |
| **Unlock TTL** | Time-limited identity sessions with automatic expiry |
| **CORS** | Strict origin validation for browser requests |
| **Localhost Binding** | Default binding to 127.0.0.1 prevents network exposure |

### Security Flow

```
Request → CORS Check → Rate Limit Check → JWT Validation → Unlock Check → Handler
```

---

## Authentication

All protected endpoints require a valid Supabase JWT token in the Authorization header.

### Request Format

```http
Authorization: Bearer <jwt_token>
```

### JWT Validation

The bridge performs full cryptographic validation:

1. **Signature Verification** - HMAC-SHA256 using `SUPABASE_JWT_SECRET`
2. **Expiration Check** - Token must not be expired (`exp` claim)
3. **Issued-At Check** - Token must not be issued in the future (`iat` claim, 60s tolerance)
4. **Subject Validation** - Token must contain user ID (`sub` claim)
5. **Issuer Validation** - Must match expected Supabase issuer
6. **Audience Validation** - Must be `authenticated`

### Authentication Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `missing_token` | 401 | No Authorization header |
| `invalid_format` | 401 | Not a Bearer token |
| `empty_token` | 401 | Token is empty |
| `invalid_token` | 401 | Malformed JWT |
| `invalid_signature` | 401 | Signature verification failed |
| `token_expired` | 401 | Token has expired |
| `invalid_iat` | 401 | Token issued in the future |
| `missing_sub` | 401 | Missing subject claim |
| `invalid_issuer` | 401 | Issuer mismatch |
| `invalid_audience` | 401 | Audience mismatch |

---

## Rate Limiting

IP-based rate limiting protects against brute-force attacks on authentication.

### Default Configuration

| Parameter | Value |
|-----------|-------|
| Max Failed Attempts | 10 |
| Window Duration | 15 minutes |
| Lockout Duration | 30 minutes |

### Behavior

- Failed authentication attempts are counted per IP address
- After exceeding the limit, the IP is locked out
- Successful authentication clears the rate limit state
- Expired entries are cleaned up every 5 minutes

### Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1800
Content-Type: application/json

{
  "error": "rate_limited",
  "code": "too_many_requests",
  "message": "Too many failed attempts. Try again in 1800 seconds.",
  "retryAfter": 1800
}
```

---

## Identity Session Management

Protected operations require an "unlocked" identity session with configurable TTL.

### Session Lifecycle

```
Locked (default) → POST /unlock → Unlocked (TTL active) → TTL expires OR POST /lock → Locked
```

### Default TTL

- **Duration:** 15 minutes
- **Configurable via:** `UNLOCK_TTL_MINUTES` environment variable

### Unlock Requirements by Endpoint

| Endpoint | Auth Required | Unlock Required |
|----------|---------------|-----------------|
| GET /health | ❌ | ❌ |
| POST /unlock | ✅ | ❌ |
| GET /unlock/status | ✅ | ❌ |
| POST /lock | ✅ | ❌ |
| POST /connect | ✅ | ✅ |
| GET /status | ✅ | ❌ |
| POST /disconnect | ✅ | ✅ |

### Session Locked Error

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "forbidden",
  "code": "session_locked",
  "message": "Identity session is locked. Call POST /unlock first."
}
```

---

## Endpoints

### GET /health

Returns bridge health status. **Public endpoint** - no authentication required.

#### Response

```json
{
  "status": "ok",
  "version": "0.4.0",
  "xxdkReady": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "ok" if bridge is running |
| `version` | string | Bridge version |
| `xxdkReady` | boolean | Whether xxDK is initialized (TODO) |

---

### POST /unlock

Creates or refreshes an unlocked identity session. Requires authentication but NOT unlock status.

#### Request

```http
POST /unlock
Authorization: Bearer <token>
Content-Type: application/json

{}
```

#### Response

```json
{
  "success": true,
  "expiresAt": "2025-01-15T12:30:00Z",
  "ttlSeconds": 900
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether unlock succeeded |
| `expiresAt` | string (ISO 8601) | When the session expires |
| `ttlSeconds` | number | Seconds until expiry |
| `error` | string | Error message (if failed) |

---

### GET /unlock/status

Returns current unlock status. Requires authentication but NOT unlock status.

#### Request

```http
GET /unlock/status
Authorization: Bearer <token>
```

#### Response (Unlocked)

```json
{
  "unlocked": true,
  "expiresAt": "2025-01-15T12:30:00Z",
  "ttlRemainingSeconds": 845
}
```

#### Response (Locked)

```json
{
  "unlocked": false
}
```

---

### POST /lock

Immediately locks the identity session. Requires authentication but NOT unlock status.

#### Request

```http
POST /lock
Authorization: Bearer <token>
Content-Type: application/json

{}
```

#### Response

```json
{
  "success": true
}
```

---

### POST /connect

Initiates a cMixx connection to a target URL. **Requires authentication AND unlock**.

#### Request

```http
POST /connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetUrl": "https://example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetUrl` | string | Yes | URL to connect to |

#### Response

```json
{
  "success": true,
  "sessionId": "sim-1234567890"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether connection initiated |
| `sessionId` | string | Session identifier (when connected) |
| `error` | string | Error message (if failed) |

#### Errors

| HTTP | Error | Description |
|------|-------|-------------|
| 400 | Invalid request body | JSON parsing failed |
| 400 | targetUrl is required | Missing target URL |
| 403 | session_locked | Identity not unlocked |

---

### GET /status

Returns current connection status. Requires authentication but NOT unlock.

#### Request

```http
GET /status
Authorization: Bearer <token>
```

#### Response

```json
{
  "state": "secure",
  "targetUrl": "https://example.com",
  "sessionId": "sim-1234567890",
  "latency": 2045
}
```

| Field | Type | Description |
|-------|------|-------------|
| `state` | string | Connection state: `idle`, `connecting`, `secure`, `error` |
| `targetUrl` | string | Target URL (if connecting/connected) |
| `sessionId` | string | Session ID (if connected) |
| `latency` | number | Connection latency in ms (if secure) |
| `error` | string | Error message (if error state) |

---

### POST /disconnect

Resets the current session. **Requires authentication AND unlock**.

#### Request

```http
POST /disconnect
Authorization: Bearer <token>
Content-Type: application/json

{}
```

#### Response

```json
{
  "success": true
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "error_type",
  "code": "error_code",
  "message": "Human-readable description"
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (authentication failed) |
| 403 | Forbidden (session locked) |
| 405 | Method Not Allowed |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8090 | HTTP server port |
| `BIND_ADDR` | 127.0.0.1 | Bind address (localhost for security) |
| `ENVIRONMENT` | production | Set to `development` to allow all CORS origins |
| `SUPABASE_JWT_SECRET` | (required) | Supabase JWT secret for signature verification |
| `JWT_ISSUER` | (Supabase default) | Expected JWT issuer |
| `JWT_AUDIENCE` | authenticated | Expected JWT audience |
| `UNLOCK_TTL_MINUTES` | 15 | Identity session TTL in minutes |

### Starting the Bridge

```bash
# Production
export SUPABASE_JWT_SECRET='your-jwt-secret'
go run main.go

# Development (allows all CORS origins)
export ENVIRONMENT=development
export SUPABASE_JWT_SECRET='your-jwt-secret'
go run main.go

# Custom port and TTL
export PORT=9000
export UNLOCK_TTL_MINUTES=30
go run main.go
```

---

## CORS Policy

### Allowed Origins

**Production:**
- `https://privxx.app`
- `https://www.privxx.app`
- `*.lovable.app` (HTTPS only)
- `*.lovableproject.com` (HTTPS only)

**Development:** All origins allowed when `ENVIRONMENT=development`

### CORS Headers

```http
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Correlation-Id, X-Client-Info
Access-Control-Max-Age: 86400
```

### Preflight Requests

OPTIONS requests return 204 No Content with CORS headers.

---

## Testing

Run the included test script to validate all authentication and unlock flows:

```bash
export SUPABASE_JWT_SECRET='your-jwt-secret'
chmod +x test-jwt-auth.sh
./test-jwt-auth.sh
```

The test script covers:
1. Public endpoint access
2. Missing/invalid token handling
3. JWT signature verification
4. Claims validation (expiry, issuer, audience)
5. Unlock TTL lifecycle
6. Cross-user session isolation

---

## Security Notes

### XX Identity Protection

- XX Network identity IDs are **never** exposed to the frontend
- Identity mapping is stored server-side only
- The `X-User-Id` header (JWT subject) is used internally for session correlation

### Logging

The bridge logs:
- Connection attempts (domain only, not full URLs with parameters)
- Authentication successes/failures (user ID, not tokens)
- Rate limit events (IP addresses)
- Session unlock/lock events (user IDs)

The bridge **does not** log:
- Full URLs with query parameters
- JWT tokens or secrets
- Request/response bodies
- Sensitive user data

---

## Version History

| Version | Changes |
|---------|---------|
| 0.4.0 | Added unlock TTL enforcement, identity session management |
| 0.3.0 | Added IP-based rate limiting |
| 0.2.0 | Added JWT signature verification (HMAC-SHA256) |
| 0.1.0 | Initial release with basic JWT validation |
