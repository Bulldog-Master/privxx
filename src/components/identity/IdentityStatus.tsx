/**
 * Identity Status Component (C2 Production Model)
 * 
 * Displays identity state and provides unlock/lock actions.
 * Unlock is re-auth based, not password based.
 * Shows TTL countdown when unlocked.
 */

import { useTranslation } from "react-i18next";
import { Lock, Unlock, Loader2, Shield, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";

export function IdentityStatus() {
  const { t } = useTranslation();
  const { state, isNone, isLocked, isUnlocked, isLoading, unlockExpiresAt, createIdentity, unlock, lock } = useIdentity();
  const { formatted, timeLeft, isExpired } = useCountdown(unlockExpiresAt);

  const handleCreateIdentity = async () => {
    const success = await createIdentity();
    if (success) {
      toast.success(t("identityCreated", "Secure identity created"));
    }
  };

  const handleUnlock = async () => {
    const success = await unlock();
    if (success) {
      toast.success(t("identityUnlocked", "Identity unlocked"));
    }
  };

  const handleLock = async () => {
    const success = await lock();
    if (success) {
      toast.success(t("identityLocked", "Identity locked"));
    }
  };

  // No identity yet
  if (isNone) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{t("identity", "Identity")}</div>
          <div className="text-xs text-muted-foreground">
            {t("identityNoneStatus", "Create your secure identity")}
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleCreateIdentity}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">{t("create", "Create")}</span>
        </Button>
      </div>
    );
  }

  // Determine if session is expiring soon (under 2 minutes)
  const isExpiringSoon = isUnlocked && timeLeft > 0 && timeLeft < 120;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
      {/* Status indicator */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
          isUnlocked
            ? isExpiringSoon
              ? "bg-amber-500/10 text-amber-500"
              : "bg-emerald-500/10 text-emerald-500"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isUnlocked ? (
          <Shield className="h-5 w-5" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </div>

      {/* Status text */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{t("identity", "Identity")}</div>
        <div className="text-xs text-muted-foreground truncate">
          {isLoading && t("identityLoading", "Loading...")}
          {isUnlocked && unlockExpiresAt && (
            <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-amber-500" : ""}`}>
              <Clock className="h-3 w-3" />
              {t("sessionExpires", "Expires in {{time}}", { time: formatted })}
            </span>
          )}
          {isUnlocked && !unlockExpiresAt && t("identityReady", "Ready to send messages")}
          {isLocked && t("identityLockedStatus", "Unlock to send messages")}
        </div>
      </div>

      {/* Action button */}
      {isUnlocked ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLock}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">{t("lock", "Lock")}</span>
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={handleUnlock}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">{t("unlock", "Unlock")}</span>
        </Button>
      )}
    </div>
  );
}
