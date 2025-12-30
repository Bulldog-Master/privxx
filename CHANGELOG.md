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
