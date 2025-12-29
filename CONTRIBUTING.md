# Contributing to Privxx

Thank you for your interest in contributing to Privxx.

## Project Status

Privxx is currently in an early-stage prototype phase.
The focus is on:
- UI/UX
- connection flow
- documentation
- preparation for cMixx integration

## Development Rules

- Use **npm** as the package manager
- Do NOT use bun
- Keep changes small and focused
- Avoid visual redesigns unless explicitly approved

## Internationalization (i18n)

Privxx supports 16 languages. When adding or modifying UI strings:

1. **Always use translation keys** - Never hardcode text in components
   ```tsx
   // ✅ Correct
   const { t } = useTranslation();
   <span>{t('status.connected')}</span>
   
   // ❌ Wrong
   <span>Connected</span>
   ```

2. **Add keys to English first** - Update `public/locales/en/ui.json`

3. **Sync other languages** - Run `node scripts/sync-translations.js --write` to generate placeholders

4. **Check before committing** - The pre-commit hook runs `scripts/check-language.js` automatically

5. **Prohibited terms** - Never use "anonymous", "untraceable", or "perfect privacy" in any language

See `docs/LANGUAGE-RULES.md` for full i18n guidelines.

## Pull Requests

Before submitting a PR:
- Ensure the app builds successfully
- Keep commits clean and readable
- Describe clearly what problem is being solved
- Ensure translation keys are synchronized

By contributing, you agree that your contributions may be included under the MIT License.
