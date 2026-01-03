/**
 * About / Version Page
 * Shows current version, build hash, latest version, and update controls.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Check, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buildInfo } from "@/lib/buildInfo";
import { Link } from "react-router-dom";

export default function About() {
  const { t } = useTranslation();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateStage, setUpdateStage] = useState<"idle" | "soft" | "hard">("idle");

  const isOutdated = latestVersion && latestVersion !== buildInfo.version;
  const isUpToDate = latestVersion && latestVersion === buildInfo.version;

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/version.json?_=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLatestVersion(data.version);
      }
    } catch {
      // Silently fail
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  const softReload = () => {
    // Try cache-busting reload first
    window.location.reload();
  };

  const hardReload = async () => {
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
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateStage("soft");
    
    // Try soft reload first (just reload with cache bypass)
    // Store flag to detect if soft reload worked
    sessionStorage.setItem("privxx_update_attempt", buildInfo.version);
    
    // Give the page a moment then reload
    setTimeout(() => {
      softReload();
    }, 500);
  };

  // Check if we came back from a soft reload that didn't work
  useEffect(() => {
    const attemptedVersion = sessionStorage.getItem("privxx_update_attempt");
    if (attemptedVersion && attemptedVersion === buildInfo.version && latestVersion && latestVersion !== buildInfo.version) {
      // Soft reload didn't update, try hard reload
      sessionStorage.removeItem("privxx_update_attempt");
      setUpdating(true);
      setUpdateStage("hard");
      hardReload();
    } else if (attemptedVersion) {
      // Either updated successfully or no longer outdated
      sessionStorage.removeItem("privxx_update_attempt");
    }
  }, [latestVersion]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("about.title", "About Privxx")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("about.subtitle", "Version information and updates")}
          </p>
        </div>

        {/* Version Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t("about.versionInfo", "Version Information")}
            </CardTitle>
            <CardDescription>
              {t("about.versionDesc", "Current installation details")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("about.currentVersion", "Current Version")}</p>
                <p className="font-mono text-lg font-semibold">v{buildInfo.version}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("about.buildHash", "Build Hash")}</p>
                <p className="font-mono text-lg font-semibold">{buildInfo.build || "—"}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("about.latestVersion", "Latest Version")}</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg font-semibold">
                    {latestVersion ? `v${latestVersion}` : "—"}
                  </p>
                  {isUpToDate && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                      <Check className="mr-1 h-3 w-3" />
                      {t("about.upToDate", "Up to date")}
                    </Badge>
                  )}
                  {isOutdated && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {t("about.updateAvailable", "Update available")}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkForUpdates}
                disabled={checking}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                {t("about.checkUpdates", "Check")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Update Card */}
        <Card className={isOutdated ? "border-amber-500/50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {t("about.updateApp", "Update App")}
            </CardTitle>
            <CardDescription>
              {isOutdated
                ? t("about.updateAvailableDesc", "A new version is available. Click below to update.")
                : t("about.noUpdateDesc", "You're running the latest version.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {updateStage !== "idle" && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                {updateStage === "soft" && (
                  <p>{t("about.softReloading", "Attempting quick refresh...")}</p>
                )}
                {updateStage === "hard" && (
                  <p>{t("about.hardReloading", "Clearing caches and reloading...")}</p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleUpdate}
              disabled={updating || isUpToDate}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${updating ? "animate-spin" : ""}`} />
              {updating
                ? t("about.updating", "Updating...")
                : isOutdated
                  ? t("about.updateNow", "Update Now")
                  : t("about.forceRefresh", "Force Refresh")}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t("about.updateNote", "This will clear cached data and reload the app.")}
            </p>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/whats-new" className="flex items-center gap-1 hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("about.releaseNotes", "Release Notes")}
          </Link>
          <Link to="/privacy" className="flex items-center gap-1 hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("privacyPolicyTitle", "Privacy Policy")}
          </Link>
          <Link to="/terms" className="flex items-center gap-1 hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("termsTitle", "Terms of Service")}
          </Link>
        </div>
      </div>
    </div>
  );
}
