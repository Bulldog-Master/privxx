# Threat Model

## Threats

### Browser Compromise

- **Risk**: Malicious scripts access sensitive data
- **Mitigation**: No cryptographic identity stored in browser

### Token Replay

- **Risk**: Stolen tokens reused for unauthorized access
- **Mitigation**: Short TTL, session-based unlock, rate limiting

### Abuse of Public Endpoints

- **Risk**: DoS attacks on public-facing endpoints
- **Mitigation**: Rate limiting at Bridge and Proxy layers

### Metadata Correlation

- **Risk**: Network observers correlate timing/patterns
- **Mitigation**: cMixx mixnet routing (when enabled)

## Architecture Mitigations

### Server-Side Identity Only

- All cryptographic operations happen in the backend
- Browser only holds session tokens, never keys

### Session-Based Unlock TTL

- Identity unlocks expire after a configurable period
- Users must re-authenticate to extend session

### Bridge-Only Access Boundary

- Frontend cannot reach backend directly
- Bridge enforces all access control policies

### Rate Limiting + Request Caps

- Per-IP and per-user rate limits at Bridge layer
- Prevents abuse and resource exhaustion

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────┐
│ UNTRUSTED: Browser / Client                             │
├─────────────────────────────────────────────────────────┤
│ SEMI-TRUSTED: Proxy (public entry point)                │
├─────────────────────────────────────────────────────────┤
│ TRUSTED: Bridge (security boundary)                     │
├─────────────────────────────────────────────────────────┤
│ TRUSTED: Backend / xxDK (identity + keys)               │
└─────────────────────────────────────────────────────────┘
```
