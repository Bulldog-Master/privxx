# Translation Synchronization Report

**Generated:** December 2025  
**Last Updated:** December 29, 2025  
**Reference File:** `public/locales/en/ui.json` (395 keys)

---

## Summary

| Language | Code | Key Count | Missing | Status |
|----------|------|-----------|---------|--------|
| English | en | 395 | 0 | ✅ Complete (Reference) |
| Arabic | ar | 395 | 0 | ✅ Synchronized |
| Bengali | bn | 395 | 0 | ✅ Synchronized |
| Chinese | zh | 395 | 0 | ✅ Synchronized |
| Dutch | nl | 395 | 0 | ✅ Synchronized |
| French | fr | 395 | 0 | ✅ Synchronized |
| German | de | 395 | 0 | ✅ Synchronized |
| Hindi | hi | 395 | 0 | ✅ Synchronized |
| Indonesian | id | 395 | 0 | ✅ Synchronized |
| Japanese | ja | 395 | 0 | ✅ Synchronized |
| Korean | ko | 395 | 0 | ✅ Synchronized |
| Portuguese | pt | 395 | 0 | ✅ Synchronized |
| Russian | ru | 395 | 0 | ✅ Synchronized |
| Spanish | es | 395 | 0 | ✅ Synchronized |
| Turkish | tr | 395 | 0 | ✅ Synchronized |
| Urdu | ur | 395 | 0 | ✅ Synchronized |

**All 16 languages are fully synchronized.**

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

## Key Categories (395 total)

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
| Diagnostics Page | 21 |

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

---

*Report updated by Privxx i18n sync - December 29, 2025*
