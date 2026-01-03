/**
 * Stale Build Warning
 * Fetches /version.json and compares against bundled version.
 * Shows a prominent TOP BANNER when the app is running an outdated version.
 * Tries soft reload first, then hard reload if needed.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { buildInfo } from "@/lib/buildInfo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function StaleBuildWarning() {
  const { t } = useTranslation();
  const [stale, setStale] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [stage, setStage] = useState<"idle" | "soft" | "hard">("idle");

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Add cache-busting query param to bypass aggressive caching
        const res = await fetch(`/version.json?_=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.version && data.version !== buildInfo.version) {
          setStale(true);
          setLatestVersion(data.version);
        }
      } catch {
        // Silently fail - version check is non-critical
      }
    };

    // Check on mount
    checkVersion();

    // Re-check every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if we came back from a failed soft reload
  useEffect(() => {
    const attemptedVersion = sessionStorage.getItem("privxx_update_attempt");
    if (attemptedVersion && attemptedVersion === buildInfo.version && stale) {
      // Soft reload didn't work, do hard reload
      sessionStorage.removeItem("privxx_update_attempt");
      hardReload();
    } else if (attemptedVersion) {
      sessionStorage.removeItem("privxx_update_attempt");
    }
  }, [stale]);

  const softReload = () => {
    window.location.reload();
  };

  const hardReload = async () => {
    setStage("hard");
    try {
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      // Clear caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Continue anyway
    }
    window.location.reload();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setStage("soft");
    
    // Store flag to detect if soft reload worked
    sessionStorage.setItem("privxx_update_attempt", buildInfo.version);
    
    // Give a moment then soft reload
    setTimeout(() => {
      softReload();
    }, 300);
  };

  if (!stale || dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-amber-950 shadow-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">
              {t("staleBuild.title", "Update Available")}
            </span>
            <span className="mx-2">·</span>
            <span>
              {t(
                "staleBuild.description",
                "You're on v{{current}}, latest is v{{latest}}",
                { current: buildInfo.version, latest: latestVersion || "?" }
              )}
            </span>
            <Link to="/about" className="ml-2 underline underline-offset-2 hover:no-underline">
              {t("staleBuild.learnMore", "Learn more")}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 gap-1.5 bg-amber-950 text-amber-100 hover:bg-amber-900"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {stage === "idle" && t("staleBuild.refresh", "Update")}
            {stage === "soft" && t("staleBuild.refreshing", "Refreshing...")}
            {stage === "hard" && t("staleBuild.clearing", "Clearing...")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-amber-950 hover:bg-amber-600/50"
            onClick={() => setDismissed(true)}
            aria-label={t("common.dismiss", "Dismiss")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
