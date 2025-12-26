import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "src");
const forbidden = [
  "https://privxx.app",
  "/cmixx/",
  "/xxdk/",
  "localStorage"
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let bad = [];

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  for (const token of forbidden) {
    if (s.includes(token)) bad.push({ file: f, token });
  }
}

if (bad.length) {
  console.error("Privacy checks failed:");
  for (const b of bad) console.error(`- ${b.token} found in ${b.file}`);
  process.exit(1);
}

console.log("Privacy checks passed.");
