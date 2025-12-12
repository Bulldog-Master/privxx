# Privxx Proxy Specification (Phase 2)

This document describes the backend that will be built in Phase 2.

## Overview

Privxx Proxy is responsible for:

1. Receiving encrypted HTTP-like requests from the Privxx client via cMixx.
2. Decrypting messages using xxDK.
3. Forwarding HTTP(S) requests to target sites.
4. Returning HTTP responses back through cMixx.

## Message Formats

### Client → Proxy Request

```json
{
  "version": 1,
  "type": "http_request",
  "request_id": "<uuid>",
  "method": "GET",
  "url": "https://example.com",
  "headers": {},
  "body": ""
}
```

### Proxy → Client Response

```json
{
  "version": 1,
  "type": "http_response",
  "request_id": "<uuid>",
  "status": 200,
  "headers": {
    "Content-Type": "text/html"
  },
  "body": "<html>...</html>"
}
```

> **Note:** Body may use Base64 encoding for binary responses.

## Security Rules

- No logging of full URLs with parameters
- No logging of IP addresses
- No analytics or telemetry
- No storage of session data
- Headers sanitized before forwarding

## Technology Options

| Language | Notes |
|----------|-------|
| **Go** | Best balance of performance and simplicity |
| **Rust** | Strong safety guarantees |
| **Node.js** | Easy prototyping, less performant |

## Current Status

🚧 **Not yet implemented** — This spec defines requirements for Phase 2.
