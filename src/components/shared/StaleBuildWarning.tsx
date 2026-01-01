/**
 * Stale Build Warning
 * Alerts users if the current build is behind expected latest.
 * Compares build hash against a simple "expected" value fetched on mount.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { buildInfo } from "@/lib/buildInfo";

const EXPECTED_BUILD_KEY = "privxx_expected_build";

export function StaleBuildWarning() {
  const { t } = useTranslation();
  const [stale, setStale] = useState(false);
  const [expectedBuild, setExpectedBuild] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on the published domain
    const isPublished = window.location.hostname === "privxx.lovable.app" || window.location.hostname === "privxx.app";
    if (!isPublished) return;

    // Get expected build from sessionStorage (set by preview)
    const expected = sessionStorage.getItem(EXPECTED_BUILD_KEY);
    if (expected && buildInfo.build && expected !== buildInfo.build) {
      setStale(true);
      setExpectedBuild(expected);
    }
  }, []);

  // On preview URLs, save the current build as "expected"
  useEffect(() => {
    const isPreview = window.location.hostname.includes("lovableproject.com") || window.location.hostname.includes("localhost");
    if (isPreview && buildInfo.build) {
      sessionStorage.setItem(EXPECTED_BUILD_KEY, buildInfo.build);
    }
  }, []);

  if (!stale) return null;

  return (
    <div className="flex items-center gap-2 rounded bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        {t(
          "staleBuild.warning",
          "This published build ({{current}}) may be outdated. Expected: {{expected}}. Please republish.",
          { current: buildInfo.build || "unknown", expected: expectedBuild || "?" }
        )}
      </span>
    </div>
  );
}
