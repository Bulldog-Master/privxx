# Translation Synchronization Report

**Generated:** January 2026  
**Last Updated:** January 1, 2026  
**Reference File:** `public/locales/en/ui.json` (894 keys)

---

## Summary

| Language | Code | Key Count | Placeholders | Quality | Status |
|----------|------|-----------|--------------|---------|--------|
| English | en | 894 | 0 | 100% | ✅ Reference |
| Spanish | es | 894 | 0 | 100% | ✅ Complete |
| French | fr | 894 | 0 | 100% | ✅ Complete |
| German | de | 894 | 0 | 100% | ✅ Complete |
| Arabic | ar | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Bengali | bn | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Hebrew | he | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Hindi | hi | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Indonesian | id | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Italian | it | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Japanese | ja | 894 | ~95 | ~89% | ⚠️ Needs Translation |
| Korean | ko | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Dutch | nl | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Polish | pl | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Portuguese | pt | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Russian | ru | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Turkish | tr | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Urdu | ur | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Yiddish | yi | 894 | ~47 | ~95% | ⚠️ Needs Translation |
| Chinese | zh | 894 | ~47 | ~95% | ⚠️ Needs Translation |

**Structure Status:** All 20 languages have 100% key completeness (894/894 keys each).  
**Quality Status:** 4/20 languages are fully translated. 16 languages have placeholder markers.

---

## Recent Update (January 1, 2026)

### New Keys Added (+78 keys)

The following key namespaces were added for new security and diagnostics components:

| Namespace | Keys | Purpose |
|-----------|------|---------|
| `debugBundle.*` | 6 | Auth Debug Bundle component |
| `backendStatus.*` | 17 | Backend Status page |
| `passkeyFlow.*` | 15 | Passkey Setup Guide |
| `recoveryCodes.*` | 16 | 2FA Recovery Codes Management |
| `securityChecklist.*` | 22 | Security Settings Checklist |
| Root keys | 2 | `invalidCodeLength`, `copyAllCodes` |

### Fully Translated Languages

The following languages received complete native translations for all new keys:

1. ✅ **English** (`en`) — Reference language
2. ✅ **Spanish** (`es`) — Full native translations
3. ✅ **French** (`fr`) — Full native translations  
4. ✅ **German** (`de`) — Full native translations

### Languages with Placeholders

All other 16 languages received structured placeholders (`[XX]` prefix) for easy identification:

```
[AR] Arabic placeholder text
[BN] Bengali placeholder text
[HE] Hebrew placeholder text
...
```

---

## Automation Status

### Pre-Commit Hook

The Husky pre-commit hook syncs all 20 languages when English is modified:

```bash
# When en/ui.json is staged:
# 1. Runs check-language.js --fix on ALL languages
# 2. Auto-stages all modified locale files
# 3. Commits everything together
```

### CI/CD Workflow

GitHub Actions (`.github/workflows/ci.yml`):
- Executes `check-language.js --fix` on every push to main
- Auto-commits synced translations with `chore: auto-sync translations [skip ci]`

---

## Governance Compliance

### Verified
- ✅ All files use identical key structure (894 keys each)
- ✅ No forbidden terms detected ("anonymous", "untraceable", "perfect privacy")
- ✅ Brand terms preserved untranslated: Privxx, cMixx, xxDK, XX Network
- ✅ RTL languages (ar, he, ur, yi) properly configured

### Language Governance Rules
Per `docs/LANGUAGE-RULES.md`:
- **Never translate**: Privxx, cMixx, xxDK, XX Network
- **Forbidden words**: "anonymous", "untraceable", "perfect privacy", "guaranteed"
- **Preferred terms**: "private", "metadata reduction", "private routing"
- **RTL support**: Arabic (ar), Hebrew (he), Urdu (ur), Yiddish (yi)

---

## Key Categories (894 total)

| Category | Key Count |
|----------|-----------|
| Auth & Security | ~180 |
| Diagnostics/Bridge | ~120 |
| Connection Alerts | ~60 |
| Settings & Profile | ~100 |
| Privacy/Terms | ~50 |
| Messages & Compose | ~40 |
| Browser/Tunnel | ~30 |
| Payments | ~25 |
| General UI | ~100 |
| **New Components** | **78** |

---

## Translation Priority

### Priority 1 (High-traffic)
- 🔶 Chinese (`zh`) — 47 placeholders
- 🔶 Japanese (`ja`) — 95 placeholders
- 🔶 Portuguese (`pt`) — 47 placeholders

### Priority 2 (RTL languages)
- 🔶 Arabic (`ar`) — 95 placeholders
- 🔶 Hebrew (`he`) — 95 placeholders
- 🔶 Urdu (`ur`) — 47 placeholders
- 🔶 Yiddish (`yi`) — 47 placeholders

### Priority 3 (Other)
- 🔶 Bengali (`bn`), Hindi (`hi`), Indonesian (`id`), Italian (`it`)
- 🔶 Korean (`ko`), Dutch (`nl`), Polish (`pl`), Russian (`ru`), Turkish (`tr`)

---

## Maintenance

### Adding New Keys

1. **Edit only** `public/locales/en/ui.json`
2. **Commit normally** — pre-commit hook auto-syncs all 20 languages
3. All other locale files receive `[XX]` placeholders automatically

### Manual Sync Command

```bash
# Sync all languages (writes placeholders)
node scripts/sync-translations.js --write

# Dry-run (show what would be added)
node scripts/sync-translations.js --dry-run

# Check for placeholder markers
grep -r "\[AR\]\|\[BN\]\|\[ZH\]" public/locales/
```

---

*Report updated by Privxx i18n sync — January 1, 2026*
