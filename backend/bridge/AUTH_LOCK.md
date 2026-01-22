# AUTH LOCK (DO NOT CHANGE WITHOUT EXPLICIT DECISION)

- Supabase access tokens are ES256 (asymmetric).
- Verification MUST use JWKS with kid rotation support.
- No HS256 shared secret verification.
- No per-request /auth/v1/user verifier calls in production.
- Required headers for protected routes:
  - Authorization: Bearer <access_token>
  - X-User-Id: <session.user.id>   (for app-level routing)
  - X-Request-Id: <client request id>

Issuer expected:
  iss = https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1
aud expected:
  aud = authenticated

JWKS:
  https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1/.well-known/jwks.json
