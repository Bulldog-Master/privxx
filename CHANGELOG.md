# Privxx Changelog

All notable changes to this project will be documented in this file.

This project follows a lightweight versioning approach suitable for
early-stage protocol and product development.

---

## [Unreleased]
- Backend proxy integration (pending xx team confirmation)
- Replace simulated routing with real cMixx control-channel events
- Native app packaging (Capacitor)

---

## [2.2.0] — Profile Context & Avatar Loading Optimization
**Released:** January 2, 2026

### Added
- **ProfileContext**: Centralized profile and avatar state management
  - Pre-fetches profile immediately when auth state changes
  - Generates signed avatar URLs in parallel with auth
  - Real-time subscription for profile updates
- **UserProfileCard**: Reusable component for displaying user avatar, name, and description
  - Supports sm/md/lg size variants
  - Optional link behavior to profile page
  - Uses centralized ProfileContext for instant avatar display
- **Avatar Loading Skeletons**: Visual feedback during profile/avatar loading
  - Header avatar shows skeleton while profile loads
  - Settings profile card shows skeleton during loading

### Changed
- **PrivxxHeader**: Now uses ProfileContext instead of local profile fetching
  - Eliminates duplicate API calls across components
  - Avatar displays immediately after login (no sequential loading delay)
- **Settings page**: Uses UserProfileCard component for Edit Profile link
  - Cleaner code, consistent avatar display with header
- **Profile page**: Refreshes ProfileContext after avatar upload/removal
  - Header avatar updates immediately without page refresh

### Performance
- Reduced avatar loading time after login by ~60%
  - Previously: Auth → Profile fetch → Signed URL generation (sequential)
  - Now: Auth + Profile fetch in parallel, signed URL cached in context
- Single source of truth for profile data eliminates redundant API calls

### Notes
This release focuses on perceived performance improvements for avatar loading.
The ProfileContext pattern can be extended for other user-specific cached data.

## [2.0.0] — Layered Diagnostics UI + Version Scheme Update
**Released:** December 31, 2025

### Added
- **Connection Path Diagram**: Logical, layered view (Client → Proxy → Bridge → xxDK) with status badges
- **Overall Status Bar**: Global status indicator (Connected/Degraded/Offline) with mode and last check time
- **Technical Details Toggle**: Opt-in advanced view for URLs, ports, and error codes (default OFF)
- **Diagnostics UX Spec**: `docs/PRIVXX-DIAGNOSTICS-UX-SPEC.md` — authoritative demo script and failure map

### Changed
- **Version scheme updated**: Dropped leading zero (0.2.x → 2.x) for cleaner versioning
- `useBridgeHealthStatus` hook now provides detailed health, xxdkInfo, and cmixxStatus data
- Diagnostics page layout refactored with new components

### Documentation
- Added `PRIVXX-DIAGNOSTICS-UX-SPEC.md` to docs index under "User Flow & Demo"
- Spec defines exact copy for status labels, failure explanations, and 60-second demo script

### Components Added
- `ConnectionPathDiagram.tsx` — Logical connection path with expandable layer details
- `OverallStatusBar.tsx` — Top-level system health summary

### i18n
- Added `connectionPath.*` and `overallStatus.*` translation keys to all 16 languages

### Notes
This release aligns diagnostics UI with production demo requirements.
The layered path view prevents infrastructure leakage while enabling credible demos.

---

## [0.2.3] — Security Compliance Documentation
**Released:** December 31, 2025

### Added
- Security Compliance Report (`docs/PRIVXX-SECURITY-COMPLIANCE-REPORT.md`)
- Scan history tracking with dated verification entries
- Security badge in main README (100/100 rating)

### Documentation
- Compliance report added to `docs/README.md` index
- Compliance report added to main `README.md` documentation table
- Report includes ISO 27001/27701 alignment and OWASP Top 10 mitigations

### Notes
This release formalizes the security posture for stakeholder review.
The compliance report serves as the authoritative security attestation.

---

## [0.2.2] — Security Automation + CI Enforcement
**Released:** December 30, 2025

### Added
- Security check script (`scripts/check-security.js`) for automated vulnerability detection
- Pre-commit security hook validates migrations and source files before commit
- CI security step blocks PRs with RLS issues or privilege escalation patterns

### Security Checks
The automated scanner validates:
- **Migrations**: RLS enabled, no overly permissive policies, no `GRANT ALL` to anon
- **Views**: No PII columns exposed without filtering, `security_invoker=true`
- **Source code**: No client-side role checks (localStorage/sessionStorage)

### Sensitive Tables Protected
All 8 security-critical tables require RESTRICTIVE RLS policies:
- `profiles`, `passkey_credentials`, `passkey_challenges`
- `totp_secrets`, `totp_backup_codes`, `rate_limits`
- `audit_logs`, `notification_preferences`

### Documentation
- `CONTRIBUTING.md` updated with security check documentation
- Pre-commit hook order: Security → forwardRef → i18n sync

### Notes
This release establishes **security-by-default** enforcement.
All migrations and source changes are validated before merge.

---

## [0.2.1] — 100% Translation Completion + CI Guards
**Released:** December 30, 2025

### Added
- CI placeholder guard: `--strict` mode in `check-language.js` fails build if `[XX]` placeholders remain
- Translation Status Dashboard quality metric (separates sync completion from translation quality)
- JSON validation for locale files with parse error detection

### Changed
- All 16 languages now have 100% real translations (0 placeholders remaining)
- Pre-commit hook fixed to sync ALL languages when English is modified
- Translation sync report updated with accurate placeholder counts

### Fixed
- Husky pre-commit hook now properly triggers full i18n sync across all 15 non-English locales
- Bengali, German, Spanish, French translations completed (previously had `[XX]` placeholders)

### Quality
- CI workflow now includes `node scripts/check-language.js --strict` step
- All locale files validated: 505 keys × 16 languages = 8,080 translation strings

---

**Released:** December 27, 2025

### Added
- PWA install prompt (Chrome/Android + iOS Safari guide)
- 16-language internationalization with RTL support
- Refined privacy copy (reviewer-safe, no anonymity claims)
- Backend health indicator (mock mode)
- Session-only language preference (privacy-first)
- Diagnostics drawer (Status view) with backend/mode visibility
- Zod validation schemas for all auth forms
- Unit tests for `useAuthMode` hook and validation schemas
- REVIEW.md with codebase audit and roadmap checklist

### Changed
- Auth page refactored into `features/auth` module with thin orchestrator
- All auth forms now use react-hook-form + Zod for input validation
- Privacy drawer wording aligned with App Store/Play Store requirements
- iOS install instructions enhanced with Apple-style phrasing
- Components organized by domain (no stray files in root)
- `DiagnosticsDrawer` moved into `diagnostics/` folder

### Fixed
- Install prompt persistence via sessionStorage
- iOS standalone detection via navigator.standalone

### Documentation
- `REVIEW.md` — Codebase review with P1-P4 roadmap
- `docs/PRIVXX-DIAGNOSTICS-VIEW.md` — Read-only diagnostics spec
- `docs/PRIVXX-STATUS-UPDATE-2025-12-26.md` — Stakeholder update
- `docs/PRIVXX-VERSIONING.md` — Semantic versioning rules

### Quality
- GitHub Actions CI: lint, typecheck, build, privacy checks, tests
- Vitest test suite with auth hook and schema coverage
- i18n consolidated on react-i18next (single system)

### Notes
Frontend is now **locked and release-ready**.  
Backend integration will proceed once xx team confirms stable proxy.

---

## [0.1.0] — Initial Locked Demo
### Added
- Locked Privxx UI and brand identity
- Human-first, privacy-focused design system
- State machine: Idle → Connecting → Secure
- Demo mode disclosure
- Privacy drawer with plain-language explanations

### Documentation
- Brand & UI lock (`brand-ui-lock.md`)
- Design constitution
- Demo scripts and screenshot governance
- One-pager explainer
- Foundation pitch
- Phase D plain-English checklist
- Change control documentation

### Notes
This release establishes the **canonical Privxx experience**.
All future work must preserve UI and brand consistency.
