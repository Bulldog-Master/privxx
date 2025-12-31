# Translation Contribution Guide

Thank you for helping make Privxx accessible to users worldwide! This guide explains how to contribute translations.

## Overview

Privxx supports 16 languages with a goal of 100% translation coverage. All translations are stored in JSON files under `public/locales/{lang}/ui.json`.

### Supported Languages

| Code | Language | RTL |
|------|----------|-----|
| `en` | English (reference) | No |
| `ar` | العربية (Arabic) | **Yes** |
| `bn` | বাংলা (Bengali) | No |
| `de` | Deutsch (German) | No |
| `es` | Español (Spanish) | No |
| `fr` | Français (French) | No |
| `hi` | हिन्दी (Hindi) | No |
| `id` | Indonesia | No |
| `ja` | 日本語 (Japanese) | No |
| `ko` | 한국어 (Korean) | No |
| `nl` | Nederlands (Dutch) | No |
| `pt` | Português (Portuguese) | No |
| `ru` | Русский (Russian) | No |
| `tr` | Türkçe (Turkish) | No |
| `ur` | اردو (Urdu) | **Yes** |
| `zh` | 中文 (Chinese) | No |

## Adding a New Language

### Step 1: Create the locale file

1. Copy the English reference file:
   ```bash
   cp public/locales/en/ui.json public/locales/{lang_code}/ui.json
   ```

2. Replace `{lang_code}` with the ISO 639-1 code (e.g., `it` for Italian).

### Step 2: Register the language

Update these files to add your language:

**`src/i18n/index.ts`** — Add to `supportedLngs` array:
```typescript
supportedLngs: ['en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'id', 'de', 'ja', 'nl', 'tr', 'ko', 'it'],
```

**`src/components/shared/LanguageSelector.tsx`** — Add to `languages` array:
```typescript
{ code: 'it', label: 'Italiano' },
```

**`src/components/shared/LanguagePills.tsx`** — Add to both `languageLabels` and `supportedLanguages`:
```typescript
const languageLabels: Record<string, string> = {
  // ... existing
  it: "IT",
};

const supportedLanguages = [
  // ... existing
  'it'
];
```

**`src/components/shared/RtlProvider.tsx`** — If the language is RTL, add to detection:
```typescript
const isRtlLanguage = (lang: string): boolean => {
  return lang === 'ar' || lang === 'ur' || lang === 'he'; // Add RTL languages
};
```

### Step 3: Translate all keys

Translate every key in your new `ui.json` file. See "Translation Guidelines" below.

### Step 4: Verify with the dashboard

1. Run the app locally: `npm run dev`
2. Navigate to `/diagnostics`
3. Check the Translation Status Dashboard shows 100% for your language

## Improving Existing Translations

1. Open `public/locales/{lang}/ui.json`
2. Find and improve the translation
3. Submit a pull request with your changes

## Translation Guidelines

### Brand Terms (Never Translate)

Keep these exactly as written:
- **Privxx**
- **cMixx**
- **xxDK**
- **xx Network**

### Tone

- Calm, modern, human-first
- Avoid fear-based language or hype
- No absolutist claims ("100% secure", "military-grade")

### Preferred Terms

| ❌ Avoid | ✅ Use Instead |
|----------|---------------|
| anonymous | private |
| untraceable | metadata reduction |
| military-grade | privacy-focused |
| 100% secure | designed for privacy |

### UI Text Length

- Status labels: 1–2 words (e.g., "Idle", "Connected")
- Subtext: ≤32 characters when possible
- Keep translations roughly the same length as English

### RTL Languages (Arabic, Urdu)

- The app automatically mirrors layout for RTL languages
- Keep brand names in Latin characters (Privxx, cMixx)
- Test your translations by switching to the language in the app

### Placeholders

Never leave placeholder markers like `[AR]` or `[ES]` — these will fail CI checks.

## JSON Structure

Translations use a flat key structure with dot notation for namespacing:

```json
{
  "status.idle": "Idle",
  "status.connecting": "Connecting",
  "status.connected": "Connected",
  "privacy.title": "Your Privacy Matters",
  "errors.networkFailed": "Network request failed"
}
```

### Key Categories

| Prefix | Purpose |
|--------|---------|
| `status.*` | Connection states |
| `privacy.*` | Privacy messaging |
| `errors.*` | Error messages |
| `common.*` | Shared terms |
| `diagnostics.*` | Diagnostics panel |
| `settings.*` | Settings page |
| `identity.*` | Identity management |

## Quality Checks

Before submitting, ensure:

1. **Valid JSON** — Use a JSON validator
2. **No placeholders** — No `[XX]` markers remaining
3. **All keys present** — Same key count as English file
4. **Brand terms preserved** — Privxx, cMixx, xxDK unchanged

### Automated Validation

The CI pipeline runs:
```bash
node scripts/check-language.js --strict
```

This fails the build if:
- Any placeholders remain
- JSON is malformed
- Keys are missing

## Testing Your Translation

1. Start the dev server: `npm run dev`
2. Click the globe icon (🌐) and select your language
3. Navigate through the app to verify all text displays correctly
4. Check RTL layout if applicable (Arabic, Urdu)
5. Verify the Translation Status Dashboard shows 100%

## Submitting Your Contribution

1. Fork the repository
2. Create a branch: `git checkout -b translation/{lang_code}`
3. Make your changes
4. Run validation: `node scripts/check-language.js`
5. Commit with message: `i18n: add/improve {language} translations`
6. Open a pull request

### PR Requirements

- [ ] All keys translated (no placeholders)
- [ ] Valid JSON structure
- [ ] Brand terms unchanged
- [ ] Tone matches guidelines
- [ ] Tested in the app

## Questions?

- Check existing translations for examples
- Review `docs/LANGUAGE-RULES.md` for detailed style guidance
- Open an issue if you need clarification

---

Thank you for helping make Privxx accessible to everyone! 🌍
