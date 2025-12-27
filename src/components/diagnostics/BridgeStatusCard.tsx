/**
 * Bridge Status Card
 * 
 * Shows real-time Bridge connection status with JWT validation state.
 */

import { useAuth } from "@/contexts/AuthContext";
import { useIdentity } from "@/contexts/IdentityContext";
import { useTTLCountdown } from "@/hooks/useTTLCountdown";
import { useTranslations } from "@/lib/i18n";
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Key, 
  Timer, 
  User,
  Unlock,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StatusRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  subValue?: React.ReactNode;
}

const StatusRow = ({ icon, label, value, valueColor = "text-primary", subValue }: StatusRowProps) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2 text-primary/60">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <div className="text-right">
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
      {subValue && <div className="text-xs text-primary/50">{subValue}</div>}
    </div>
  </div>
);

const BridgeStatusCard = () => {
  const { t } = useTranslations();
  const { isAuthenticated, session } = useAuth();
  const { state, unlockExpiresAt, isUnlocked } = useIdentity();
  
  const ttl = useTTLCountdown(unlockExpiresAt);

  // JWT validation state
  const hasValidJWT = !!session?.access_token;
  const jwtExpiresAt = session?.expires_at 
    ? new Date(session.expires_at * 1000).toLocaleTimeString()
    : null;

  // Identity state display
  const getIdentityDisplay = () => {
    switch (state) {
      case "unlocked":
        return { 
          label: t("identityUnlocked"), 
          color: "text-emerald-500",
          icon: <Unlock className="h-4 w-4 text-emerald-500" />
        };
      case "locked":
        return { 
          label: t("identityLocked"), 
          color: "text-amber-500",
          icon: <Lock className="h-4 w-4 text-amber-500" />
        };
      case "loading":
        return { 
          label: t("diagnosticsChecking"), 
          color: "text-primary/60",
          icon: <Shield className="h-4 w-4 text-primary/60 animate-pulse" />
        };
      default:
        return { 
          label: t("identityNone") || "No Identity", 
          color: "text-primary/60",
          icon: <ShieldX className="h-4 w-4 text-primary/60" />
        };
    }
  };

  const identityDisplay = getIdentityDisplay();

  // TTL color based on remaining time
  const getTTLColor = () => {
    if (ttl.isExpired) return "text-destructive";
    if (ttl.isCritical) return "text-destructive";
    if (ttl.isWarning) return "text-amber-500";
    return "text-emerald-500";
  };

  const getTTLProgressColor = () => {
    if (ttl.isExpired || ttl.isCritical) return "bg-destructive";
    if (ttl.isWarning) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <div className="flex items-center gap-2 pb-2 border-b">
        {isAuthenticated && hasValidJWT ? (
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
        ) : (
          <ShieldX className="h-5 w-5 text-amber-500" />
        )}
        <h3 className="text-sm font-semibold">{t("diagnosticsBridge") || "Bridge Status"}</h3>
      </div>

      {/* Authentication Status */}
      <StatusRow
        icon={<User className="h-4 w-4" />}
        label={t("diagnosticsAuth") || "Authentication"}
        value={isAuthenticated ? (t("diagnosticsAuthenticated") || "Authenticated") : (t("diagnosticsNotAuthenticated") || "Not Authenticated")}
        valueColor={isAuthenticated ? "text-emerald-500" : "text-amber-500"}
      />

      {/* JWT Validation */}
      <StatusRow
        icon={<Key className="h-4 w-4" />}
        label={t("diagnosticsJWT") || "JWT Token"}
        value={hasValidJWT ? (t("diagnosticsValid") || "Valid") : (t("diagnosticsInvalid") || "Invalid")}
        valueColor={hasValidJWT ? "text-emerald-500" : "text-destructive"}
        subValue={jwtExpiresAt ? `Expires: ${jwtExpiresAt}` : undefined}
      />

      {/* Identity State */}
      <StatusRow
        icon={identityDisplay.icon}
        label={t("identity")}
        value={identityDisplay.label}
        valueColor={identityDisplay.color}
      />

      {/* TTL Countdown (only when unlocked) */}
      {isUnlocked && unlockExpiresAt && (
        <div className="pt-2 border-t mt-2 space-y-2">
          <StatusRow
            icon={
              ttl.isCritical ? (
                <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              ) : (
                <Timer className="h-4 w-4" />
              )
            }
            label={t("diagnosticsTTL") || "Session TTL"}
            value={ttl.remainingFormatted}
            valueColor={getTTLColor()}
          />
          <div className="space-y-1">
            <Progress 
              value={ttl.percentRemaining} 
              className="h-1.5"
              indicatorClassName={getTTLProgressColor()}
            />
            <p className="text-xs text-primary/50 text-center">
              {ttl.isWarning && !ttl.isExpired && (t("diagnosticsTTLWarning") || "Session expiring soon")}
              {ttl.isExpired && (t("diagnosticsTTLExpired") || "Session expired — unlock again")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeStatusCard;
