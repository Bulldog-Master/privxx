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

## [0.2.0] — Frontend Complete (Preview Mode)
### Added
- PWA install prompt (Chrome/Android + iOS Safari guide)
- 16-language internationalization with RTL support
- Refined privacy copy (reviewer-safe, no anonymity claims)
- Backend health indicator (mock mode)
- Session-only language preference (privacy-first)

### Changed
- Privacy drawer wording aligned with App Store/Play Store requirements
- iOS install instructions enhanced with Apple-style phrasing
- All translations verified for semantic safety

### Fixed
- Install prompt persistence via sessionStorage
- iOS standalone detection via navigator.standalone

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
