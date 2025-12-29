/**
 * Translation Sync Script
 * 
 * Detects missing translation keys and generates placeholder values.
 * Run: node scripts/sync-translations.js
 * 
 * Options:
 *   --dry-run    Show what would be added without writing files
 *   --write      Write missing keys to language files
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "public/locales");
const EN_PATH = path.join(ROOT, "en", "ui.json");

// Language display names for placeholder prefixes
const LANG_PREFIXES = {
  ar: "[AR]",
  bn: "[BN]",
  de: "[DE]",
  es: "[ES]",
  fr: "[FR]",
  hi: "[HI]",
  id: "[ID]",
  ja: "[JA]",
  ko: "[KO]",
  nl: "[NL]",
  pt: "[PT]",
  ru: "[RU]",
  tr: "[TR]",
  ur: "[UR]",
  zh: "[ZH]",
};

function getNestedValue(obj, keyPath) {
  return keyPath.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getAllKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

function generatePlaceholder(enValue, langCode) {
  const prefix = LANG_PREFIXES[langCode] || `[${langCode.toUpperCase()}]`;
  // For short strings, prefix them; for longer ones, truncate
  if (typeof enValue !== "string") {
    return `${prefix} ${JSON.stringify(enValue)}`;
  }
  if (enValue.length > 60) {
    return `${prefix} ${enValue.substring(0, 50)}...`;
  }
  return `${prefix} ${enValue}`;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || !args.includes("--write");
  
  if (!fs.existsSync(EN_PATH)) {
    console.error("❌ English reference file not found:", EN_PATH);
    process.exit(1);
  }

  const enContent = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
  const enKeys = getAllKeys(enContent);
  
  console.log(`\n📋 Reference: ${enKeys.length} keys in English\n`);

  const langDirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== "en")
    .map(d => d.name)
    .sort();

  let totalMissing = 0;
  let totalExtra = 0;
  const updates = [];

  for (const lang of langDirs) {
    const langPath = path.join(ROOT, lang, "ui.json");
    
    if (!fs.existsSync(langPath)) {
      console.log(`⚠️  [${lang}] Missing ui.json file`);
      continue;
    }

    try {
      const langContent = JSON.parse(fs.readFileSync(langPath, "utf8"));
      const langKeys = getAllKeys(langContent);
      
      const missingKeys = enKeys.filter(k => !langKeys.includes(k));
      const extraKeys = langKeys.filter(k => !enKeys.includes(k));

      if (missingKeys.length === 0 && extraKeys.length === 0) {
        console.log(`✅ [${lang}] Synchronized`);
        continue;
      }

      if (missingKeys.length > 0) {
        console.log(`⚠️  [${lang}] Missing ${missingKeys.length} keys:`);
        missingKeys.forEach(k => console.log(`      + ${k}`));
        totalMissing += missingKeys.length;

        // Generate placeholders
        for (const key of missingKeys) {
          const enValue = getNestedValue(enContent, key);
          const placeholder = generatePlaceholder(enValue, lang);
          setNestedValue(langContent, key, placeholder);
        }

        updates.push({ lang, langPath, content: langContent, added: missingKeys.length });
      }

      if (extraKeys.length > 0) {
        console.log(`⚠️  [${lang}] Extra ${extraKeys.length} keys (not in English):`);
        extraKeys.forEach(k => console.log(`      - ${k}`));
        totalExtra += extraKeys.length;
      }

    } catch (e) {
      console.error(`❌ [${lang}] Invalid JSON: ${e.message}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Summary: ${totalMissing} missing, ${totalExtra} extra keys`);
  
  if (updates.length > 0) {
    if (dryRun) {
      console.log(`\n🔍 Dry run — no files modified`);
      console.log(`   Run with --write to add placeholders\n`);
    } else {
      console.log(`\n✏️  Writing placeholders to ${updates.length} files...\n`);
      
      for (const { lang, langPath, content, added } of updates) {
        const output = JSON.stringify(content, null, 2);
        fs.writeFileSync(langPath, output + "\n", "utf8");
        console.log(`   ✅ [${lang}] Added ${added} placeholder keys`);
      }
      
      console.log(`\n✅ Done! Review placeholders and replace with real translations.`);
      console.log(`   Placeholders are prefixed with [LANG] for easy identification.\n`);
    }
  } else if (totalMissing === 0 && totalExtra === 0) {
    console.log(`\n✅ All ${langDirs.length} languages are fully synchronized!\n`);
  }
}

main();
