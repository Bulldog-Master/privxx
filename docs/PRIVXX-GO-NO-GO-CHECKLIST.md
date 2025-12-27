# Privxx Go/No-Go Checklist

**Purpose:** Pre-launch verification for production readiness  
**Last Updated:** 2025-12-27  
**Status:** Active

---

## 🔐 Security Verification

### Database Layer
- [ ] RLS enabled on all user-data tables
- [ ] `passkey_challenges` — service-role only (no client access)
- [ ] `passkey_credentials` — user can only access own records
- [ ] `totp_secrets` — user can only read own, no client write
- [ ] `totp_backup_codes` — user can only read own, no client write
- [ ] `profiles` — user can only CRUD own profile
- [ ] `notification_preferences` — user can only CRUD own preferences
- [ ] `rate_limits` — service-role only

### Authentication
- [ ] Supabase JWT auth working
- [ ] Email signup with auto-confirm enabled
- [ ] Session timeout configured (default: 30 min)
- [ ] No anonymous signups enabled
- [ ] Passkey registration/authentication functional
- [ ] TOTP setup/verification functional

### Bridge Security
- [ ] Bridge binds to `127.0.0.1` only
- [ ] No direct xx-backend internet exposure
- [ ] Cloudflare tunnel configured correctly
- [ ] JWT validation on all protected endpoints
- [ ] Unlock TTL enforced server-side

---

## 🌐 Infrastructure Verification

### Canonical Origin
- [ ] Single origin decided: `https://privxx.app`
- [ ] Frontend served from canonical origin
- [ ] Bridge API accessible from canonical origin
- [ ] No port numbers in production URLs
- [ ] HTTP → HTTPS redirect configured
- [ ] www → non-www redirect configured (or vice versa)

### Backend Services
- [ ] xx-backend process running (`systemctl status xx-backend`)
- [ ] Bridge process running (`systemctl status privxx-bridge`)
- [ ] Bridge health endpoint responding (`/health`)
- [ ] Cloudflare tunnel active

### DNS & SSL
- [ ] A record pointing to correct IP
- [ ] SSL certificate valid and auto-renewing
- [ ] No mixed content warnings

---

## 🔄 Functional Verification

### Identity Flow
- [ ] Identity status check works (`/identity/status`)
- [ ] Identity creation works (`/identity/create`)
- [ ] Identity unlock works (`/identity/unlock`)
- [ ] Identity lock works (`/identity/lock`)
- [ ] Unlock TTL expiry enforced

### Messaging Flow
- [ ] Message send works (`/messages/send`)
- [ ] Message appears in recipient inbox
- [ ] Inbox polling functional (`/messages/inbox`)
- [ ] Message round-trip completes through xxDK

### Connection States (UI)
- [ ] Idle state displays correctly
- [ ] Connecting state shows progress
- [ ] Connected/Secure state displays
- [ ] Error states handled gracefully
- [ ] Demo mode indicator visible when applicable

---

## 📱 Client Verification

### PWA
- [ ] Service worker registered
- [ ] App installable on mobile
- [ ] Offline fallback page works
- [ ] Icons display correctly (192x192, 512x512)

### Cross-Browser
- [ ] Chrome desktop — functional
- [ ] Safari desktop — functional
- [ ] Chrome mobile (Android) — functional
- [ ] Safari mobile (iOS) — functional
- [ ] Firefox desktop — functional

### Accessibility
- [ ] Skip to content link works
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA

---

## 🎭 Demo Readiness

### Demo Environment
- [ ] Demo account created and tested
- [ ] Demo URL accessible
- [ ] Demo script rehearsed
- [ ] Backup demo flow prepared (if live fails)

### Observability
- [ ] Bridge logs accessible via SSH
- [ ] Key events logged (auth, unlock, send, receive)
- [ ] No sensitive data in logs (JWT, message content)

### Documentation
- [ ] Demo script finalized (`PRIVXX-FULL-DEMO-SCRIPT.md`)
- [ ] Q&A responses prepared
- [ ] Technical architecture diagram available

---

## ✅ Go/No-Go Decision Matrix

| Category | Status | Blocker? |
|----------|--------|----------|
| Security | ⬜ | Yes |
| Infrastructure | ⬜ | Yes |
| Functional | ⬜ | Yes |
| Client | ⬜ | No |
| Demo Readiness | ⬜ | No |

### Decision Criteria
- **GO:** All "Blocker: Yes" categories pass
- **NO-GO:** Any "Blocker: Yes" category fails
- **CONDITIONAL GO:** All blockers pass, non-blockers have known issues with workarounds

---

## 📋 Sign-Off

| Role | Name | Date | Decision |
|------|------|------|----------|
| Technical Lead | | | ⬜ GO / ⬜ NO-GO |
| Security Review | | | ⬜ GO / ⬜ NO-GO |
| Product Owner | | | ⬜ GO / ⬜ NO-GO |

---

*This checklist should be completed before any production deployment or stakeholder demo.*
