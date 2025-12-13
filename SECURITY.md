# Security Policy

## Reporting a Vulnerability

Privxx takes security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainers directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on progress
- Credit in the fix announcement (if desired)

### Scope

This policy covers:
- The Privxx web application (`src/`)
- Future backend components (`backend/`)
- Build and deployment configurations

### Out of Scope

- Third-party dependencies (report to upstream maintainers)
- The xx Network / cMixx protocol itself (report to xx Network team)

## Security Principles

Privxx is built on these security foundations:

1. **No tracking or analytics** — We don't collect data we don't need
2. **No persistent identifiers** — Sessions are ephemeral
3. **Post-quantum cryptography** — Future-proof protection (when cMixx integration is complete)
4. **Transparency** — Demo mode is clearly labeled; we don't claim capabilities we don't have
