#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * Validates all translation files have matching keys with the English base file.
 * Checks for:
 * - Missing keys
 * - Extra keys
 * - Placeholder markers (e.g., [ES], [FR])
 * - Invalid JSON syntax
 * 
 * Usage:
 *   node scripts/validate-translations.js          # Check all languages
 *   node scripts/validate-translations.js --strict # Fail on any issue
 *   node scripts/validate-translations.js --fix    # Auto-fix by syncing keys
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, "..", "public", "locales");
const EN_FILE = path.join(LOCALES_DIR, "en", "ui.json");

// Placeholder pattern used by sync script
const PLACEHOLDER_PATTERN = /^\[(EN|ES|FR|DE|PT|IT|NL|PL|RU|AR|HE|YI|ZH|JA|KO|HI|BN|UR|ID|TR)\]/i;

// Forbidden terms per LANGUAGE-RULES.md
const FORBIDDEN_TERMS = ["anonymous", "untraceable", "perfect privacy", "military-grade", "100% secure"];

/**
 * Recursively get all keys from a nested object
 */
function getAllKeys(obj, prefix = "") {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Get value at a nested key path
 */
function getNestedValue(obj, keyPath) {
  return keyPath.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Check if a value contains placeholder markers
 */
function hasPlaceholder(value) {
  if (typeof value !== "string") return false;
  return PLACEHOLDER_PATTERN.test(value);
}

/**
 * Check if a value contains forbidden terms
 */
function hasForbiddenTerms(value) {
  if (typeof value !== "string") return [];
  const lower = value.toLowerCase();
  return FORBIDDEN_TERMS.filter((term) => lower.includes(term.toLowerCase()));
}

/**
 * Validate a single language file
 */
function validateLanguage(langCode, enKeys, enData) {
  const langDir = path.join(LOCALES_DIR, langCode);
  const langFile = path.join(langDir, "ui.json");
  
  const result = {
    code: langCode,
    valid: true,
    errors: [],
    warnings: [],
    missingKeys: [],
    extraKeys: [],
    placeholders: [],
    forbiddenTerms: [],
  };
  
  if (!fs.existsSync(langFile)) {
    result.valid = false;
    result.errors.push(`File not found: ${langFile}`);
    return result;
  }
  
  let langData;
  try {
    const content = fs.readFileSync(langFile, "utf8");
    langData = JSON.parse(content);
  } catch (error) {
    result.valid = false;
    result.errors.push(`Invalid JSON: ${error.message}`);
    return result;
  }
  
  const langKeys = getAllKeys(langData);
  const langKeySet = new Set(langKeys);
  const enKeySet = new Set(enKeys);
  
  // Check for missing keys
  for (const key of enKeys) {
    if (!langKeySet.has(key)) {
      result.missingKeys.push(key);
    }
  }
  
  // Check for extra keys
  for (const key of langKeys) {
    if (!enKeySet.has(key)) {
      result.extraKeys.push(key);
    }
  }
  
  // Check for placeholders and forbidden terms
  for (const key of langKeys) {
    const value = getNestedValue(langData, key);
    
    if (hasPlaceholder(value)) {
      result.placeholders.push({ key, value });
    }
    
    const forbidden = hasForbiddenTerms(value);
    if (forbidden.length > 0) {
      result.forbiddenTerms.push({ key, terms: forbidden });
    }
  }
  
  // Determine validity
  if (result.missingKeys.length > 0) {
    result.warnings.push(`${result.missingKeys.length} missing keys`);
  }
  if (result.extraKeys.length > 0) {
    result.warnings.push(`${result.extraKeys.length} extra keys`);
  }
  if (result.placeholders.length > 0) {
    result.warnings.push(`${result.placeholders.length} placeholder markers`);
  }
  if (result.forbiddenTerms.length > 0) {
    result.valid = false;
    result.errors.push(`${result.forbiddenTerms.length} forbidden terms found`);
  }
  
  return result;
}

/**
 * Main validation function
 */
function main() {
  const args = process.argv.slice(2);
  const isStrict = args.includes("--strict");
  const shouldFix = args.includes("--fix");
  
  console.log("🔍 Validating translation files...\n");
  
  // Load English reference
  if (!fs.existsSync(EN_FILE)) {
    console.error("❌ English reference file not found:", EN_FILE);
    process.exit(1);
  }
  
  let enData;
  try {
    enData = JSON.parse(fs.readFileSync(EN_FILE, "utf8"));
  } catch (error) {
    console.error("❌ Invalid English JSON:", error.message);
    process.exit(1);
  }
  
  const enKeys = getAllKeys(enData);
  console.log(`📚 Reference: ${enKeys.length} keys in English\n`);
  
  // Get all language directories
  const langDirs = fs.readdirSync(LOCALES_DIR).filter((dir) => {
    const stat = fs.statSync(path.join(LOCALES_DIR, dir));
    return stat.isDirectory() && dir !== "en";
  });
  
  const results = [];
  let hasErrors = false;
  let hasWarnings = false;
  
  for (const langCode of langDirs) {
    const result = validateLanguage(langCode, enKeys, enData);
    results.push(result);
    
    if (!result.valid) hasErrors = true;
    if (result.warnings.length > 0) hasWarnings = true;
    
    // Print result
    const icon = result.valid ? (result.warnings.length > 0 ? "⚠️" : "✅") : "❌";
    console.log(`${icon} ${langCode.toUpperCase()}`);
    
    if (result.errors.length > 0) {
      result.errors.forEach((e) => console.log(`   ❌ ${e}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => console.log(`   ⚠️  ${w}`));
    }
    if (result.forbiddenTerms.length > 0) {
      result.forbiddenTerms.forEach(({ key, terms }) => {
        console.log(`   🚫 "${key}" contains: ${terms.join(", ")}`);
      });
    }
  }
  
  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Languages checked: ${results.length}`);
  console.log(`   Valid: ${results.filter((r) => r.valid && r.warnings.length === 0).length}`);
  console.log(`   Warnings: ${results.filter((r) => r.valid && r.warnings.length > 0).length}`);
  console.log(`   Errors: ${results.filter((r) => !r.valid).length}`);
  
  // Exit code
  if (hasErrors) {
    console.log("\n❌ Validation failed with errors");
    process.exit(1);
  } else if (isStrict && hasWarnings) {
    console.log("\n⚠️  Validation failed (strict mode)");
    process.exit(1);
  } else {
    console.log("\n✅ Validation passed");
    process.exit(0);
  }
}

main();
