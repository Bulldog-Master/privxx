/**
 * Security Score Indicator
 * 
 * Visual ring indicator showing overall security score based on checklist items.
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityScoreIndicatorProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function SecurityScoreIndicator({ size = "md", showLabel = true }: SecurityScoreIndicatorProps) {
  const { t } = useTranslation();
  const { user, isEmailVerified } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateScore = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let passed = 0;
    let total = 5;

    // Check 1: Email verified
    if (isEmailVerified) passed++;

    // Check 2: 2FA enabled
    try {
      const { data, error } = await supabase.functions.invoke("totp-auth", {
        body: { action: "status" },
      });
      if (!error && data?.enabled) passed++;
    } catch {
      // Skip this check
    }

    // Check 3: Passkeys configured
    try {
      const { data, error } = await supabase
        .from("passkey_credentials")
        .select("id")
        .eq("user_id", user.id);
      if (!error && data && data.length > 0) passed++;
    } catch {
      // Skip this check
    }

    // Check 4: Session timeout configured properly
    try {
      const { data } = await supabase
        .from("profiles")
        .select("session_timeout_minutes")
        .eq("user_id", user.id)
        .maybeSingle();
      const timeout = data?.session_timeout_minutes || 15;
      if (timeout <= 30) passed++;
    } catch {
      // Skip this check
    }

    // Check 5: Backend services available
    try {
      const { error } = await supabase.functions.invoke("turnstile-config");
      if (!error) passed++;
    } catch {
      // Skip this check
    }

    setScore(Math.round((passed / total) * 100));
    setLoading(false);
  }, [user, isEmailVerified]);

  useEffect(() => {
    calculateScore();
  }, [calculateScore]);

  const dimensions = {
    sm: { size: 48, stroke: 4, fontSize: "text-xs" },
    md: { size: 80, stroke: 6, fontSize: "text-lg" },
    lg: { size: 120, stroke: 8, fontSize: "text-2xl" },
  };

  const { size: svgSize, stroke, fontSize } = dimensions[size];
  const radius = (svgSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? (score / 100) * circumference : 0;

  const getScoreColor = () => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getStrokeColor = () => {
    if (score === null) return "stroke-muted";
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-amber-500";
    return "stroke-destructive";
  };

  const getLabel = () => {
    if (score === null) return t("securityScore.unknown", "Unknown");
    if (score >= 80) return t("securityScore.excellent", "Excellent");
    if (score >= 60) return t("securityScore.good", "Good");
    if (score >= 40) return t("securityScore.fair", "Fair");
    return t("securityScore.needsWork", "Needs Work");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          className="transform -rotate-90"
          width={svgSize}
          height={svgSize}
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className={`${getStrokeColor()} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {size === "sm" ? (
            <Shield className={`h-4 w-4 ${getScoreColor()}`} />
          ) : (
            <>
              <span className={`font-bold ${fontSize} ${getScoreColor()}`}>
                {score ?? "—"}
              </span>
              {size === "lg" && (
                <span className="text-xs text-muted-foreground">
                  {t("securityScore.outOf", "/ 100")}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${getScoreColor()}`}>
          {getLabel()}
        </span>
      )}
    </div>
  );
}
