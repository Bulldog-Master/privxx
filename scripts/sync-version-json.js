#!/usr/bin/env node
/**
 * Syncs public/version.json with src/lib/buildInfo.ts
 * Run: node scripts/sync-version-json.js
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const buildInfoPath = resolve(root, "src/lib/buildInfo.ts");
const versionJsonPath = resolve(root, "public/version.json");

// Read buildInfo.ts
const buildInfoContent = readFileSync(buildInfoPath, "utf-8");

// Extract version using regex
const versionMatch = buildInfoContent.match(/version:\s*["']([^"']+)["']/);
if (!versionMatch) {
  console.error("❌ Could not extract version from buildInfo.ts");
  process.exit(1);
}

const version = versionMatch[1];

// Read current version.json
let currentVersion = null;
try {
  const currentContent = readFileSync(versionJsonPath, "utf-8");
  currentVersion = JSON.parse(currentContent).version;
} catch {
  // File doesn't exist or is invalid
}

// Check if update is needed
if (currentVersion === version) {
  console.log(`✓ version.json already at v${version}`);
  process.exit(0);
}

// Write new version.json
const newContent = JSON.stringify({ version }, null, 2) + "\n";
writeFileSync(versionJsonPath, newContent, "utf-8");

console.log(`✓ Updated version.json: ${currentVersion || "none"} → v${version}`);
