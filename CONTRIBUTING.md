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

Privxx supports 16 languages with automated synchronization.

### Adding New Strings

1. **Always use translation keys** - Never hardcode text in components
   ```tsx
   // ✅ Correct
   const { t } = useTranslation();
   <span>{t('status.connected')}</span>
   
   // ❌ Wrong
   <span>Connected</span>
   ```

2. **Edit only the English file** - Add keys to `public/locales/en/ui.json`

3. **Commit normally** - The pre-commit hook automatically syncs all 16 languages

### Automated Workflow

When you modify `en/ui.json` and commit:
1. Husky pre-commit hook runs `node scripts/check-language.js --fix`
2. Missing keys are added to all 15 other locales as `[XX]` placeholders
3. All modified locale files are auto-staged and committed together

### Manual Commands

```bash
# Sync all languages (adds placeholders for missing keys)
node scripts/check-language.js --fix

# Verify sync without modifying files
node scripts/check-language.js

# Strict mode - fails if ANY placeholders remain (used in CI)
node scripts/check-language.js --strict
```

### CI Enforcement

The CI workflow runs `--strict` mode on all PRs and pushes:
- ✅ Build passes if all translations are complete (no `[XX]` placeholders)
- ❌ Build fails if any `[XX]` placeholders remain in locale files

This ensures production releases have 100% real translations.

### Prohibited Terms

Never use these terms in any language:
- "anonymous", "anonymity"
- "untraceable"
- "perfect privacy", "absolute privacy"
- "guaranteed"

See `docs/LANGUAGE-RULES.md` for full i18n guidelines.

## Security Checks

Privxx enforces automated security validation on all commits and PRs.

### What Gets Checked

The security script (`scripts/check-security.js`) validates:

1. **Migration files** (`supabase/migrations/*.sql`)
   - Tables without RLS enabled
   - Overly permissive policies (`USING (true)`)
   - Policies granting access to `public` role
   - `GRANT ALL` to `anon` role
   - Views with `security_invoker=false` (may bypass RLS)
   - PII columns exposed in views without proper filtering

2. **Source files** (`src/**/*.ts`, `src/**/*.tsx`)
   - Role checks using client storage (privilege escalation risk)
   - Hardcoded admin checks without server-side validation

### Sensitive Tables

These tables MUST have RESTRICTIVE RLS policies:
- `profiles`
- `passkey_credentials`
- `passkey_challenges`
- `totp_secrets`
- `totp_backup_codes`
- `rate_limits`
- `audit_logs`
- `notification_preferences`

### Pre-commit Hook

When you commit migrations or source files:
1. Husky pre-commit hook runs `node scripts/check-security.js`
2. Errors block the commit
3. Warnings are displayed but don't block

### Manual Commands

```bash
# Run security checks
node scripts/check-security.js
```

### CI Enforcement

The CI workflow runs security checks on all PRs and pushes:
- ❌ Build fails if security errors are detected
- ⚠️ Warnings are logged but don't fail the build

See `SECURITY.md` for the full security architecture.

## Pull Requests

Before submitting a PR:
- Ensure the app builds successfully
- Keep commits clean and readable
- Describe clearly what problem is being solved
- Ensure translation keys are synchronized
- Verify security checks pass

By contributing, you agree that your contributions may be included under the MIT License.
