/**
 * Compact Identity Status Component (C2 Production Model)
 * 
 * Minimal identity indicator for header/nav use.
 * Unlock is re-auth based, not password based.
 * Shows TTL countdown in tooltip when unlocked.
 */

import { useTranslation } from "react-i18next";
import { Lock, Unlock, Loader2, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdentity } from "@/contexts/IdentityContext";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IdentityStatusCompact() {
  const { t } = useTranslation();
  const { state, isNone, isLocked, isUnlocked, isLoading, unlockExpiresAt, createIdentity, unlock, lock } = useIdentity();
  const { formatted, timeLeft } = useCountdown(unlockExpiresAt);

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

  const getTooltipText = () => {
    if (isLoading) return t("identityLoading", "Loading...");
    if (isNone) return t("identityNoneStatus", "Create your secure identity");
    if (isUnlocked && unlockExpiresAt) {
      return t("sessionExpiresIn", "Session expires in {{time}}", { time: formatted });
    }
    if (isUnlocked) return t("identityReady", "Ready to send messages");
    return t("identityLockedStatus", "Unlock to send messages");
  };

  // Determine if session is expiring soon (under 2 minutes)
  const isExpiringSoon = isUnlocked && timeLeft > 0 && timeLeft < 120;

  // No identity yet
  if (isNone && !isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateIdentity}
              disabled={isLoading}
              className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
              aria-label={t("create", "Create")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">
                {t("identity", "Identity")}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isUnlocked ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLock}
              disabled={isLoading}
              className={`justify-start gap-2 min-h-[44px] ${
                isExpiringSoon 
                  ? "text-amber-500 hover:text-amber-400" 
                  : "text-emerald-500 hover:text-emerald-400"
              }`}
              aria-label={t("lock", "Lock")}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Shield className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only sm:not-sr-only">
                {unlockExpiresAt ? formatted : t("identity", "Identity")}
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlock}
              disabled={isLoading}
              className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
              aria-label={t("unlock", "Unlock")}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only sm:not-sr-only">
                {t("identity", "Identity")}
              </span>
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default IdentityStatusCompact;
