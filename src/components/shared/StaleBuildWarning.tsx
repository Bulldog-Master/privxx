/**
 * Stale Build Warning
 * Fetches /version.json and compares against bundled version.
 * Shows a prominent warning if the app is running an outdated version.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { buildInfo } from "@/lib/buildInfo";
import { Button } from "@/components/ui/button";

export function StaleBuildWarning() {
  const { t } = useTranslation();
  const [stale, setStale] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
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
      // Force reload
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  if (!stale) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-lg bg-amber-500/95 px-4 py-3 text-sm text-amber-950 shadow-lg backdrop-blur">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">
            {t("staleBuild.title", "Update Available")}
          </p>
          <p className="text-xs text-amber-900">
            {t(
              "staleBuild.description",
              "You're on v{{current}}, latest is v{{latest}}",
              { current: buildInfo.version, latest: latestVersion || "?" }
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 bg-amber-950 text-amber-100 hover:bg-amber-900"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t("staleBuild.refresh", "Update")}
        </Button>
      </div>
    </div>
  );
}
