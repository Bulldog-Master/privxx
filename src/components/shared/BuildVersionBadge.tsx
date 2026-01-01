/**
 * Build Version Badge Component
 * Displays a small version badge for authenticated pages.
 */

import { buildInfo } from "@/lib/buildInfo";

export function BuildVersionBadge() {
  const versionStr = `v${buildInfo.version}${buildInfo.build ? `+${buildInfo.build}` : ""}`;

  return (
    <span
      className="inline-flex items-center rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground select-all"
      title={versionStr}
    >
      {versionStr}
    </span>
  );
}
