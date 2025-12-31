# Privacy Guarantees

## What Privxx Does NOT Do

### No Analytics by Default

- No Google Analytics, Mixpanel, or similar tracking
- No user behavior monitoring
- No A/B testing frameworks

### No Cookies Required

- Core functionality works without cookies
- Session management uses Bearer tokens
- No third-party cookie dependencies

### No Identity Material in Browser

- Private keys never leave the backend
- Browser only holds session tokens
- Token compromise ≠ identity compromise

### No Direct Browser → xxDK Connectivity

- All network operations go through Bridge
- Browser cannot initiate mixnet traffic directly
- Reduces attack surface significantly

## Data Flow

```
User Input
    ↓
Browser (session token only)
    ↓
Proxy (CORS, rate limits)
    ↓
Bridge (auth, validation)
    ↓
Backend (xxDK, keys, cMixx)
    ↓
Network (mixnet routing)
```

## Compliance Considerations

### ISO 27001

- Access control via Bridge boundary
- Audit logging at Bridge layer
- Encryption in transit (HTTPS)

### ISO 27701

- Minimal data collection
- No persistent identifiers
- User-initiated identity unlock

### GDPR-Ready

- No tracking without consent
- No cross-site identifiers
- Right to deletion supported

## Limitations

These guarantees apply to the Privxx client architecture. They do not cover:

- Third-party services integrated by users
- Backend infrastructure security (separate domain)
- Network-level metadata (handled by cMixx when enabled)
