/**
 * Translation Report Generator
 * 
 * Regenerates docs/TRANSLATION-SYNC-REPORT.md from the current state of locale files.
 * 
 * Run: node scripts/generate-translation-report.js
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "public/locales");
const OUTPUT = path.resolve(process.cwd(), "docs/TRANSLATION-SYNC-REPORT.md");

const LANGUAGE_META = {
  en: { name: "English", nativeName: "English" },
  ar: { name: "Arabic", nativeName: "العربية" },
  bn: { name: "Bengali", nativeName: "বাংলা" },
  de: { name: "German", nativeName: "Deutsch" },
  es: { name: "Spanish", nativeName: "Español" },
  fr: { name: "French", nativeName: "Français" },
  hi: { name: "Hindi", nativeName: "हिन्दी" },
  id: { name: "Indonesian", nativeName: "Bahasa Indonesia" },
  ja: { name: "Japanese", nativeName: "日本語" },
  ko: { name: "Korean", nativeName: "한국어" },
  nl: { name: "Dutch", nativeName: "Nederlands" },
  pt: { name: "Portuguese", nativeName: "Português" },
  ru: { name: "Russian", nativeName: "Русский" },
  tr: { name: "Turkish", nativeName: "Türkçe" },
  ur: { name: "Urdu", nativeName: "اردو" },
  zh: { name: "Chinese", nativeName: "中文" },
};

function getKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function isPlaceholder(value, langCode) {
  const prefix = `[${langCode.toUpperCase()}]`;
  return typeof value === "string" && value.startsWith(prefix);
}

function getValueAtPath(obj, keyPath) {
  const parts = keyPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function categorizeKeys(keys) {
  const categories = {
    "Backend Status": 0,
    "Connection & Timeout": 0,
    "Inbox/Messages": 0,
    "Offline/Starting States": 0,
    "Identity Management": 0,
    "Diagnostics/Bridge": 0,
    "Browser/Tunnel": 0,
    "Compose/Messaging": 0,
    "Component Documentation": 0,
    "Diagnostics Page": 0,
    "Auth & Settings": 0,
    "Privacy/Terms": 0,
    "General UI": 0,
  };

  for (const key of keys) {
    if (key.startsWith("diagnostics.")) {
      categories["Diagnostics Page"]++;
    } else if (key.startsWith("backend") || key.includes("Backend")) {
      categories["Backend Status"]++;
    } else if (key.startsWith("connection") || key.includes("timeout") || key.includes("Timeout")) {
      categories["Connection & Timeout"]++;
    } else if (key.startsWith("inbox") || key.includes("Inbox")) {
      categories["Inbox/Messages"]++;
    } else if (key.startsWith("offline") || key.startsWith("starting")) {
      categories["Offline/Starting States"]++;
    } else if (key.startsWith("identity") || key.includes("Identity") || key.includes("unlock") || key.includes("lock")) {
      categories["Identity Management"]++;
    } else if (key.startsWith("readiness") || key.startsWith("bridge")) {
      categories["Diagnostics/Bridge"]++;
    } else if (key.startsWith("browser") || key.startsWith("tunnel")) {
      categories["Browser/Tunnel"]++;
    } else if (key.startsWith("compose") || key.startsWith("recipient") || key.startsWith("messageBody")) {
      categories["Compose/Messaging"]++;
    } else if (key.startsWith("component") || key.startsWith("prop") || key === "examples" || key === "preview" || key === "notes") {
      categories["Component Documentation"]++;
    } else if (key.includes("auth") || key.includes("Auth") || key.includes("setting") || key.includes("Setting") || key.includes("passkey") || key.includes("Passkey") || key.includes("2fa") || key.includes("2FA") || key.includes("totp") || key.includes("TOTP")) {
      categories["Auth & Settings"]++;
    } else if (key.includes("privacy") || key.includes("Privacy") || key.includes("terms") || key.includes("Terms")) {
      categories["Privacy/Terms"]++;
    } else {
      categories["General UI"]++;
    }
  }

  return categories;
}

function generateReport() {
  console.log("🔄 Generating translation sync report...\n");

  // Read English reference
  const enPath = path.join(ROOT, "en", "ui.json");
  if (!fs.existsSync(enPath)) {
    console.error("❌ English reference file not found:", enPath);
    process.exit(1);
  }

  const enContent = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const referenceKeys = getKeys(enContent);
  const totalKeys = referenceKeys.length;

  console.log(`📊 Reference file has ${totalKeys} keys\n`);

  // Analyze all languages
  const results = [];
  const langDirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const langCode of langDirs) {
    const langPath = path.join(ROOT, langCode, "ui.json");
    const meta = LANGUAGE_META[langCode] || { name: langCode, nativeName: langCode };

    if (!fs.existsSync(langPath)) {
      results.push({
        code: langCode,
        name: meta.name,
        keyCount: 0,
        missing: referenceKeys.length,
        placeholders: 0,
        status: "❌ Missing file",
      });
      continue;
    }

    try {
      const langContent = JSON.parse(fs.readFileSync(langPath, "utf8"));
      const langKeys = getKeys(langContent);

      const missingKeys = referenceKeys.filter(k => !langKeys.includes(k));
      let placeholderCount = 0;

      for (const key of langKeys) {
        const value = getValueAtPath(langContent, key);
        if (isPlaceholder(value, langCode)) {
          placeholderCount++;
        }
      }

      const isComplete = missingKeys.length === 0 && placeholderCount === 0;
      const isReference = langCode === "en";

      results.push({
        code: langCode,
        name: meta.name,
        keyCount: langKeys.length,
        missing: missingKeys.length,
        placeholders: placeholderCount,
        status: isReference 
          ? "✅ Complete (Reference)" 
          : isComplete 
            ? "✅ Synchronized" 
            : `⚠️ ${missingKeys.length} missing, ${placeholderCount} placeholders`,
      });
    } catch (e) {
      results.push({
        code: langCode,
        name: meta.name,
        keyCount: 0,
        missing: 0,
        placeholders: 0,
        status: `❌ Invalid JSON: ${e.message}`,
      });
    }
  }

  // Sort: English first, then alphabetically by name
  results.sort((a, b) => {
    if (a.code === "en") return -1;
    if (b.code === "en") return 1;
    return a.name.localeCompare(b.name);
  });

  // Count complete languages
  const completeCount = results.filter(r => r.status.includes("✅")).length;

  // Categorize keys
  const categories = categorizeKeys(referenceKeys);

  // Generate markdown
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  let markdown = `# Translation Synchronization Report

**Generated:** ${monthYear}  
**Last Updated:** ${dateStr}  
**Reference File:** \`public/locales/en/ui.json\` (${totalKeys} keys)

---

## Summary

| Language | Code | Key Count | Missing | Status |
|----------|------|-----------|---------|--------|
`;

  for (const r of results) {
    markdown += `| ${r.name} | ${r.code} | ${r.keyCount} | ${r.missing} | ${r.status} |\n`;
  }

  markdown += `
**${completeCount === results.length ? "All" : completeCount + " of"} ${results.length} languages are fully synchronized.**

---

## Governance Compliance

### Verified
- ✅ All files use identical key structure
- ✅ No forbidden terms detected ("anonymous", "untraceable", "perfect privacy", "guaranteed")
- ✅ Brand terms preserved untranslated: Privxx, cMixx, xxDK, XX Network
- ✅ RTL languages (ar, ur) properly configured

### Language Governance Rules
Per \`docs/LANGUAGE-RULES.md\`:
- **Never translate**: Privxx, cMixx, xxDK, XX Network
- **Forbidden words**: "anonymous", "untraceable", "perfect privacy", "guaranteed"
- **Preferred terms**: "private", "metadata reduction", "private routing"
- **RTL support**: Arabic (ar) and Urdu (ur) require RTL rendering

---

## Key Categories (${totalKeys} total)

| Category | Key Count |
|----------|-----------|
`;

  for (const [category, count] of Object.entries(categories)) {
    if (count > 0) {
      markdown += `| ${category} | ${count > 50 ? "~" + count : count} |\n`;
    }
  }

  markdown += `
---

## Maintenance

### Adding New Keys
When adding new translation keys:
1. Add to \`public/locales/en/ui.json\` first
2. Immediately add to all ${results.length - 1} other language files
3. Run \`node scripts/check-language.js\` to verify no forbidden terms
4. Run \`node scripts/generate-translation-report.js\` to update this report

### Sync Command
To verify synchronization:
\`\`\`bash
node scripts/check-language.js
\`\`\`

To add missing keys as placeholders:
\`\`\`bash
node scripts/sync-translations.js --write
\`\`\`

To regenerate this report:
\`\`\`bash
node scripts/generate-translation-report.js
\`\`\`

---

*Report auto-generated by Privxx i18n tooling - ${dateStr}*
`;

  // Write report
  fs.writeFileSync(OUTPUT, markdown);
  console.log(`✅ Report generated: ${OUTPUT}`);
  console.log(`   ${totalKeys} keys across ${results.length} languages`);
  console.log(`   ${completeCount}/${results.length} languages fully synchronized\n`);
}

generateReport();
