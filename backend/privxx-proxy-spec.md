# Privxx Proxy Specification

## Overview

The Privxx Proxy is the translation layer between the cMixx mixnet and the external internet. It receives encrypted requests from Privxx clients, performs real HTTPS calls, and returns responses through the mixnet.

---

## Responsibilities

1. Receive encrypted messages over xxDK
2. Decrypt and parse request objects
3. Validate request structure and safety
4. Perform HTTPS requests to target websites
5. Sanitize response headers
6. Encrypt and return responses via cMixx

---

## Request Flow

```
Receive cMixx message
→ Decrypt with session key
→ Parse JSON request object
→ Validate URL (no internal/localhost)
→ Perform HTTPS request
→ Receive response
→ Sanitize headers
→ Wrap in JSON response object
→ Encrypt response
→ Send via cMixx
```

---

## Message Formats

### Incoming Request (from Client)

```json
{
  "version": 1,
  "type": "http_request",
  "request_id": "<random-uuid>",
  "method": "GET",
  "url": "https://example.com",
  "headers": {
    "User-Agent": "Privxx/0.1"
  },
  "body": ""
}
```

### Outgoing Response (to Client)

```json
{
  "version": 1,
  "type": "http_response",
  "request_id": "<same-uuid>",
  "status": 200,
  "headers": {
    "Content-Type": "text/html"
  },
  "body": "<html>...</html>"
}
```

> **Note:** Body may use Base64 encoding for binary responses.

---

## Security Rules

### Must Implement
- [ ] No logging of full URLs with parameters
- [ ] No logging of IP addresses
- [ ] No analytics or telemetry
- [ ] No storage of session data
- [ ] Sanitize all outgoing headers
- [ ] Validate URL scheme (https only in production)
- [ ] Block requests to internal IPs (127.x.x.x, 10.x.x.x, etc.)
- [ ] Timeout handling for slow responses

### Must NOT Do
- ❌ Log request destinations
- ❌ Store any user data
- ❌ Create correlatable identifiers
- ❌ Use cookies or session persistence
- ❌ Make requests to non-HTTPS URLs (production)

---

## Technology Options

| Language | Pros | Cons |
|----------|------|------|
| **Go** | Fast, easy concurrency, good xxDK bindings | Less strict memory safety |
| **Rust** | Memory safety, high performance | Steeper learning curve |
| **Node.js** | Easy prototyping | Less performant for production |

**Recommendation:** Go for initial implementation, consider Rust for production.

---

## Implementation Phases

### Phase 2a: Basic Proxy
- Receive cMixx messages
- Parse requests
- Forward to websites
- Return responses

### Phase 2b: Hardened Proxy
- Full security rule implementation
- Rate limiting
- Error handling
- Response size limits

### Phase 2c: Production Proxy
- Horizontal scaling
- Health monitoring (privacy-preserving)
- Geographic distribution

---

## Testing Strategy

1. **Unit Tests**: Message parsing, URL validation
2. **Integration Tests**: End-to-end with mock cMixx
3. **Security Tests**: Attempt to exfiltrate data, timing attacks
4. **Load Tests**: Concurrent request handling

---

## Dependencies

- xxDK (xx Network SDK)
- TLS 1.3 library
- HTTP client library
- JSON parsing

---

## Current Status

🚧 **Not yet implemented** – This spec defines requirements for Phase 2.
