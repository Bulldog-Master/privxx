/**
 * Language Guard Script
 * 
 * Prevents accidental privacy over-claims in UI copy and translations.
 * Run: node scripts/check-language.js
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
  process.exit(1);
}

console.log("✅ Language guard passed — no forbidden privacy claims found.");
