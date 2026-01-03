/**
 * Force Refresh Card
 * 
 * iOS/Safari can keep an outdated service worker + caches even after publish.
 * This provides a user-initiated reset that unregisters the SW, clears caches,
 * and reloads the page.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, Download } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildInfo } from "@/lib/buildInfo";

async function forceRefresh(): Promise<void> {
  // Unregister service workers
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }

  // Clear cache storage
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }

  // Reload hard
  window.location.reload();
}

async function checkForUpdate(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      // Add timeout to prevent hanging on Safari/iOS
      const updatePromise = reg.update();
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error("timeout")), 5000)
      );
      
      await Promise.race([updatePromise, timeoutPromise]).catch(() => {
        // Timeout or error - continue anyway
      });
      
      return !!reg.waiting;
    }
  } catch {
    // Ignore errors
  }
  return false;
}

async function applyUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    window.location.reload();
    return;
  }
  
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }
  window.location.reload();
}

export function ForceRefreshCard() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  // Check for updates on mount
  useEffect(() => {
    checkForUpdate().then(setUpdateAvailable);
  }, []);

  const onCheckUpdate = async () => {
    setChecking(true);
    const hasUpdate = await checkForUpdate();
    setUpdateAvailable(hasUpdate);
    setChecking(false);
    
    if (hasUpdate) {
      toast.success(t("refresh.updateFound", "Update available!"), {
        description: t("refresh.updateFoundDesc", "A new version is ready to install."),
      });
    } else {
      toast.info(t("refresh.noUpdate", "You're up to date"), {
        description: t("refresh.noUpdateDesc", "You're running the latest version."),
      });
    }
  };

  const onApplyUpdate = async () => {
    setRunning(true);
    toast.message(t("refresh.updating", "Updating…"), {
      description: t("refresh.updatingDesc", "Installing the latest version."),
    });
    await applyUpdate();
  };

  const onForceRefresh = async () => {
    setRunning(true);
    toast.message(t("refresh.forcing", "Refreshing…"), {
      description: t(
        "refresh.forcingDesc",
        "Clearing cached app data to load the latest published version."
      ),
    });

    try {
      await forceRefresh();
    } catch (err) {
      setRunning(false);
      toast.error(t("refresh.failed", "Refresh failed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const versionDisplay = buildInfo.build 
    ? `v${buildInfo.version}+${buildInfo.build.slice(0, 7)}`
    : `v${buildInfo.version}`;

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <RotateCcw className="h-5 w-5" />
            {t("refresh.title", "App Updates")}
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {versionDisplay}
          </Badge>
        </div>
        <CardDescription className="text-primary/70">
          {t(
            "refresh.description",
            "Check for updates or force refresh if the app looks out of date."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {updateAvailable ? (
          <Button 
            onClick={onApplyUpdate} 
            disabled={running} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Download className={"h-4 w-4 mr-2 " + (running ? "animate-bounce" : "")} />
            {t("refresh.installUpdate", "Install Update Now")}
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            onClick={onCheckUpdate} 
            disabled={checking || running} 
            className="w-full"
          >
            <Download className={"h-4 w-4 mr-2 " + (checking ? "animate-pulse" : "")} />
            {t("refresh.checkUpdate", "Check for Updates")}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onForceRefresh} 
          disabled={running} 
          className="w-full"
        >
          <RotateCcw className={"h-4 w-4 mr-2 " + (running ? "animate-spin" : "")} />
          {t("refresh.action", "Clear cache & reload")}
        </Button>
      </CardContent>
    </Card>
  );
}
