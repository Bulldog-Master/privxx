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
