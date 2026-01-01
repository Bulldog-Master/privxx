/**
 * Passkey Setup Indicator
 *
 * Subtle indicator in Settings when the user has not configured a passkey yet.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function PasskeySetupIndicator() {
  const { t } = useTranslation();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("passkey-auth", {
          body: { action: "status" },
        });

        if (cancelled) return;
        if (error) {
          setNeedsSetup(null);
          return;
        }

        const count = data?.credentialCount ?? 0;
        setNeedsSetup(count === 0);
      } catch {
        if (!cancelled) setNeedsSetup(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (needsSetup !== true) return null;

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-primary">
                {t("passkey.setupRecommended", "Passkey setup recommended")}
              </p>
              <Badge variant="secondary">
                {t("passkey.notSet", "Not set")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "passkey.setupRecommendedDesc",
                "Set up a passkey for faster sign-in and stronger account protection."
              )}
            </p>
            <Link
              to="#passkey-section"
              className="mt-2 inline-block text-xs text-primary/70 hover:text-primary transition-colors"
            >
              {t("passkey.goToSection", "Go to Passkeys")}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
