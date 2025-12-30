# Translation Synchronization Report

**Generated:** December 2025  
**Last Updated:** December 30, 2025  
**Reference File:** `public/locales/en/ui.json` (550 keys)

---

## Summary

| Language | Code | Key Count | Missing | Status |
|----------|------|-----------|---------|--------|
| English | en | 550 | 0 | ✅ Complete (Reference) |
| Arabic | ar | 550 | 0 | ✅ Synchronized |
| Bengali | bn | 550 | 0 | ✅ Synchronized |
| Chinese | zh | 550 | 0 | ✅ Synchronized |
| Dutch | nl | 550 | 0 | ✅ Synchronized |
| French | fr | 550 | 0 | ✅ Synchronized |
| German | de | 550 | 0 | ✅ Synchronized |
| Hindi | hi | 550 | 0 | ✅ Synchronized |
| Indonesian | id | 550 | 0 | ✅ Synchronized |
| Japanese | ja | 550 | 0 | ✅ Synchronized |
| Korean | ko | 550 | 0 | ✅ Synchronized |
| Portuguese | pt | 550 | 0 | ✅ Synchronized |
| Russian | ru | 550 | 0 | ✅ Synchronized |
| Spanish | es | 550 | 0 | ✅ Synchronized |
| Turkish | tr | 550 | 0 | ✅ Synchronized |
| Urdu | ur | 550 | 0 | ✅ Synchronized |

**All 16 languages are fully synchronized.**

---

## Recent Changes (December 30, 2025)

### Added Keys
- `diagnostics.translationStatus.jsonParseError` — JSON parse error message
- `diagnostics.translationStatus.checkFile` — File check label
- `diagnostics.translationStatus.syncProgress` — Sync progress label
- `diagnostics.translationStatus.completionVsQuality` — Quality metric explanation
- `diagnostics.translationStatus.validJson` — Valid JSON indicator

### Fixed Placeholders
- Replaced `[RU]`, `[ID]`, `[KO]`, `[NL]`, `[TR]` placeholders for `diagnostics.policy.*` keys with proper translations
- Added missing `diagnostics.policy.require_reauth` to ja (Japanese) and zh (Chinese)

---

## Governance Compliance

### Verified
- ✅ All files use identical key structure
- ✅ No forbidden terms detected ("anonymous", "untraceable", "perfect privacy", "guaranteed")
- ✅ Brand terms preserved untranslated: Privxx, cMixx, xxDK, XX Network
- ✅ RTL languages (ar, ur) properly configured

### Language Governance Rules
Per `docs/LANGUAGE-RULES.md`:
- **Never translate**: Privxx, cMixx, xxDK, XX Network
- **Forbidden words**: "anonymous", "untraceable", "perfect privacy", "guaranteed"
- **Preferred terms**: "private", "metadata reduction", "private routing"
- **RTL support**: Arabic (ar) and Urdu (ur) require RTL rendering

---

## Key Categories (550 total)

| Category | Key Count |
|----------|-----------|
| Backend Status | 7 |
| Connection & Timeout | 6 |
| Inbox/Messages | 7 |
| Offline/Starting States | 4 |
| Identity Management | 16 |
| Diagnostics/Bridge | 10 |
| Browser/Tunnel | 9 |
| Compose/Messaging | 10 |
| Component Documentation | 13 |
| Auth & Settings | ~100 |
| Privacy/Terms | ~100 |
| General UI | ~92 |
| Diagnostics Page | 30 |
| Security Dashboard | 36 |
| Translation Status Dashboard | 10 |

---

## Translation Status Dashboard Features

The diagnostics page now includes a **Translation Status Dashboard** with:

1. **Dual Metrics**
   - **Sync Completion**: Measures structure completeness (all keys present)
   - **Quality Metric**: Measures actual translation quality (non-placeholder strings)

2. **JSON Validation**
   - Detects invalid JSON in locale files
   - Shows specific file that failed to parse
   - Displays in development mode only

3. **Placeholder Detection**
   - Identifies `[XX]` style placeholder strings
   - Reports per-language placeholder counts
   - Separates completion from quality metrics

---

## Maintenance

### Adding New Keys
When adding new translation keys:
1. Add to `public/locales/en/ui.json` first
2. Immediately add to all 15 other language files
3. Run `node scripts/check-language.js` to verify no forbidden terms
4. Update this report if key count changes significantly

### Sync Command
To verify synchronization:
```bash
node scripts/check-language.js
```

To auto-add placeholders for missing keys:
```bash
node scripts/sync-translations.js --write
```

---

*Report updated by Privxx i18n sync - December 30, 2025*
