/**
 * Language Guard Script
 * 
 * 1. Prevents accidental privacy over-claims in UI copy and translations.
 * 2. Verifies all translation files are synchronized with English reference.
 * 3. Optionally auto-fixes missing keys with placeholders (--fix flag).
 * 
 * Run: node scripts/check-language.js
 * Run with auto-fix: node scripts/check-language.js --fix
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "public/locales");

const FORBIDDEN = [
  "anonymous",
  "anonymity",
  "untraceable",
  "guaranteed",
  "perfect privacy",
  "absolute privacy",
  "100% private",
  "completely anonymous",
  "total anonymity",
  "fully anonymous",
];

// Language prefixes for placeholder values
const LANG_PREFIXES = {
  ar: "[AR]", bn: "[BN]", de: "[DE]", es: "[ES]", fr: "[FR]",
  hi: "[HI]", id: "[ID]", ja: "[JA]", ko: "[KO]", nl: "[NL]",
  pt: "[PT]", ru: "[RU]", tr: "[TR]", ur: "[UR]", zh: "[ZH]",
};

const autoFix = process.argv.includes("--fix");

function walk(dir) {
  const out = [];
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(p));
      else if (p.endsWith(".json")) out.push(p);
    }
  } catch {
    // Directory doesn't exist or is inaccessible
  }
  return out;
}

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

function generatePlaceholder(enValue, langCode) {
  const prefix = LANG_PREFIXES[langCode] || `[${langCode.toUpperCase()}]`;
  if (typeof enValue !== "string") return `${prefix} ${JSON.stringify(enValue)}`;
  if (enValue.length > 60) return `${prefix} ${enValue.substring(0, 50)}...`;
  return `${prefix} ${enValue}`;
}

let hasErrors = false;

// === Check 1: Forbidden terms ===
const violations = [];

for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8").toLowerCase();
  for (const word of FORBIDDEN) {
    if (text.includes(word.toLowerCase())) {
      violations.push({ file: path.relative(process.cwd(), file), word });
    }
  }
}

if (violations.length) {
  console.error("\n❌ Language guard failed:\n");
  for (const v of violations) {
    console.error(`  - "${v.word}" found in ${v.file}`);
  }
  console.error("\nThese terms may over-promise privacy. Please revise.\n");
  hasErrors = true;
} else {
  console.log("✅ Forbidden terms check passed.");
}

// === Check 2: Translation key synchronization ===
const enPath = path.join(ROOT, "en", "ui.json");

if (fs.existsSync(enPath)) {
  const enContent = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const enKeys = getKeys(enContent);
  const syncErrors = [];
  const fixedFiles = [];

  const langDirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== "en")
    .map(d => d.name);

  for (const lang of langDirs) {
    const langPath = path.join(ROOT, lang, "ui.json");
    if (!fs.existsSync(langPath)) {
      syncErrors.push({ lang, error: "Missing ui.json file" });
      continue;
    }

    try {
      const langContent = JSON.parse(fs.readFileSync(langPath, "utf8"));
      const langKeys = getKeys(langContent);
      
      const missingKeys = enKeys.filter(k => !langKeys.includes(k));
      const extraKeys = langKeys.filter(k => !enKeys.includes(k));

      if (missingKeys.length > 0) {
        if (autoFix) {
          // Auto-fix: add placeholders for missing keys
          for (const key of missingKeys) {
            const enValue = getNestedValue(enContent, key);
            const placeholder = generatePlaceholder(enValue, lang);
            setNestedValue(langContent, key, placeholder);
          }
          const output = JSON.stringify(langContent, null, 2);
          fs.writeFileSync(langPath, output + "\n", "utf8");
          fixedFiles.push({ lang, added: missingKeys.length });
        } else {
          syncErrors.push({ 
            lang, 
            error: `Missing ${missingKeys.length} keys: ${missingKeys.slice(0, 3).join(", ")}${missingKeys.length > 3 ? "..." : ""}` 
          });
        }
      }
      if (extraKeys.length > 0) {
        syncErrors.push({ 
          lang, 
          error: `Extra ${extraKeys.length} keys: ${extraKeys.slice(0, 3).join(", ")}${extraKeys.length > 3 ? "..." : ""}` 
        });
      }
    } catch (e) {
      syncErrors.push({ lang, error: `Invalid JSON: ${e.message}` });
    }
  }

  if (fixedFiles.length > 0) {
    console.log("\n✅ Auto-fixed missing keys:");
    for (const { lang, added } of fixedFiles) {
      console.log(`   [${lang}] Added ${added} placeholder keys`);
    }
    console.log("\n   ⚠️  Review placeholders and replace with real translations.");
  }

  if (syncErrors.length > 0) {
    console.error("\n❌ Translation sync check failed:\n");
    for (const { lang, error } of syncErrors) {
      console.error(`  - [${lang}] ${error}`);
    }
    console.error("\nAll language files must match English reference keys.");
    if (!autoFix) {
      console.error("Run with --fix to auto-add missing keys as placeholders.\n");
    }
    hasErrors = true;
  } else if (fixedFiles.length === 0) {
    console.log(`✅ Translation sync check passed (${langDirs.length} languages synchronized).`);
  }
} else {
  console.warn("⚠️  English reference file not found, skipping sync check.");
}

// === Final result ===
if (hasErrors) {
  process.exit(1);
}

console.log("\n✅ All language checks passed.");
