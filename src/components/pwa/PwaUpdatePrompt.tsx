import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * PWA Update Prompt
 * 
 * iOS/Safari can keep an outdated service-worker cached build even after publish.
 * This component surfaces a user-visible "Update" action when a new build is available.
 */
export default function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const toastIdRef = useRef<string | number | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(r) {
      // Periodically check for updates to reduce Safari/iPadOS stale-cache cases.
      // (No persistent identifiers; just a timer in-memory.)
      if (!r) return;
      const intervalMs = 5 * 60 * 1000; // 5 minutes
      setInterval(() => {
        r.update();
      }, intervalMs);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    // Avoid stacking multiple toasts.
    if (toastIdRef.current) return;

    toastIdRef.current = toast(t("pwa.updateAvailable", "Update available"), {
      description: t(
        "pwa.updateAvailableDesc",
        "A new version is ready. Update to ensure security features work correctly."
      ),
      duration: Infinity,
      action: {
        label: t("pwa.updateNow", "Update"),
        onClick: () => {
          toastIdRef.current && toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
          updateServiceWorker(true);
        },
      },
      cancel: {
        label: t("pwa.later", "Later"),
        onClick: () => {
          toastIdRef.current && toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        },
      },
    });
  }, [needRefresh, t, updateServiceWorker]);

  return null;
}
