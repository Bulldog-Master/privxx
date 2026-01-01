/**
 * Force Refresh Card
 * 
 * iOS/Safari can keep an outdated service worker + caches even after publish.
 * This provides a user-initiated reset that unregisters the SW, clears caches,
 * and reloads the page.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export function ForceRefreshCard() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);

  const onRun = async () => {
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

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <RotateCcw className="h-5 w-5" />
          {t("refresh.title", "Force Refresh")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t(
            "refresh.description",
            "If the app looks out of date, this clears cached files and reloads."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onRun} disabled={running} className="w-full">
          <RotateCcw className={"h-4 w-4 mr-2 " + (running ? "animate-spin" : "")} />
          {t("refresh.action", "Clear cache & reload")}
        </Button>
      </CardContent>
    </Card>
  );
}
