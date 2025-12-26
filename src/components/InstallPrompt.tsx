import { useEffect, useMemo, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

type BIPOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: BIPOutcome }>;
}

// Detect iOS Safari (NOT Chrome/Firefox/Edge/Opera wrappers)
const isIOSSafari = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

  return isIOS && isSafari;
};

// Detect "installed/standalone" mode across platforms
const isStandalone = (): boolean => {
  // Chrome/Edge/etc.
  if (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)")?.matches) {
    return true;
  }
  // iOS Safari uses navigator.standalone
  if (typeof navigator !== "undefined" && (navigator as unknown as { standalone?: boolean }).standalone) {
    return true;
  }
  return false;
};

const SESSION_KEY = "pwa-dismissed";

export default function InstallPrompt() {
  const { t } = useTranslations();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showChromePrompt, setShowChromePrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const ios = useMemo(() => {
    try {
      return isIOSSafari();
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Session dismissal gate
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "true") {
        setDismissed(true);
        return;
      }
    } catch {
      // ignore
    }

    // Installed gate
    if (isStandalone()) return;

    // If installed during session, hide prompt and persist dismissal
    const onAppInstalled = () => {
      setShowChromePrompt(false);
      setShowIOSGuide(false);
      setDeferredPrompt(null);
      try {
        sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        // ignore
      }
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS Safari: show guide after short delay
    if (ios) {
      const timer = window.setTimeout(() => setShowIOSGuide(true), 2000);
      return () => {
        window.removeEventListener("appinstalled", onAppInstalled);
        window.clearTimeout(timer);
      };
    }

    // Chrome/Edge/Android: beforeinstallprompt
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowChromePrompt(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [ios]);

  const dismiss = () => {
    setShowChromePrompt(false);
    setShowIOSGuide(false);
    setDeferredPrompt(null);
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // ignore
    }
  };

  const installChrome = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // Either way, hide after choice; user can re-trigger via browser UI later.
      setShowChromePrompt(false);
      setDeferredPrompt(null);
      if (outcome === "dismissed") {
        // Don't persist across sessions (privacy-first); session-only is fine.
      }
    } catch {
      // If prompt fails, fall back to hiding it (no noisy errors)
      setShowChromePrompt(false);
      setDeferredPrompt(null);
    }
  };

  // Don't render if dismissed or installed
  if (dismissed || isStandalone()) return null;

  // iOS guide UI (Safari)
  if (showIOSGuide && ios) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Share className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">{t("installApp")}</div>
              <div className="text-sm text-muted-foreground">
                {t("installAppDescriptionIOS")}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Share className="h-4 w-4" /> {t("share")}
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1">
                  <Plus className="h-4 w-4" /> {t("addToHomeScreen")}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="min-h-[44px] min-w-[44px] p-2"
            onClick={dismiss}
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-3 flex justify-end">
          <Button className="min-h-[44px]" variant="outline" onClick={dismiss}>
            {t("notNow")}
          </Button>
        </div>
      </div>
    );
  }

  // Chrome/Android prompt UI
  if (showChromePrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">{t("installApp")}</div>
              <div className="text-sm text-muted-foreground">
                {t("installAppDescription")}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="min-h-[44px] min-w-[44px] p-2"
            onClick={dismiss}
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <Button className="min-h-[44px]" variant="outline" onClick={dismiss}>
            {t("notNow")}
          </Button>
          <Button className="min-h-[44px]" onClick={installChrome}>
            {t("install")}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
