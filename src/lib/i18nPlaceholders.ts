// Detects placeholder translations like "[ES] ..." or "[XX] ..."

const PLACEHOLDER_RE = /^\[[A-Z]{2}\]\s*/;

export function isPlaceholderTranslation(value: unknown): boolean {
  return typeof value === "string" && PLACEHOLDER_RE.test(value);
}

export function countPlaceholdersInObject(obj: unknown): number {
  if (!obj || typeof obj !== "object") return 0;

  let count = 0;
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (typeof v === "string") {
      if (isPlaceholderTranslation(v)) count++;
    } else if (v && typeof v === "object") {
      count += countPlaceholdersInObject(v);
    }
  }
  return count;
}
