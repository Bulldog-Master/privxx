/**
 * Passkey Header Badge
 *
 * Shows a small "Passkeys: Not set" badge in the Settings header.
 * Disappears immediately when the user registers a passkey (live refresh via realtime).
 */

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function PasskeyHeaderBadge() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [hasPasskeys, setHasPasskeys] = useState<boolean | null>(null);

  const checkStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("passkey-auth", {
        body: { action: "status" },
      });
      if (error) {
        setHasPasskeys(null);
        return;
      }
      const count = data?.credentialCount ?? 0;
      setHasPasskeys(count > 0);
    } catch {
      setHasPasskeys(null);
    }
  }, [user]);

  // Initial check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Subscribe to realtime changes on passkey_credentials table for live refresh
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("passkey-header-badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "passkey_credentials",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch status whenever passkeys change
          checkStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, checkStatus]);

  // Don't render anything if user has passkeys or status unknown
  if (hasPasskeys !== false) return null;

  return (
    <Badge
      variant="outline"
      className="text-xs gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
    >
      <KeyRound className="h-3 w-3" />
      {t("passkey.notSet", "Not set")}
    </Badge>
  );
}
