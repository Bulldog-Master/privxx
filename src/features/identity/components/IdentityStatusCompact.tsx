/**
 * Compact Identity Status Component (C2 Production Model)
 * 
 * Minimal identity indicator for header/nav use.
 * Unlock is re-auth based, not password based.
 * Shows TTL countdown in tooltip when unlocked.
 */

import { Lock, Loader2, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIdentityActions } from "@/features/identity/hooks/useIdentityActions";

export function IdentityStatusCompact() {
  const {
    isNone,
    isUnlocked,
    isLoading,
    unlockExpiresAt,
    formatted,
    isExpiringSoon,
    handleCreateIdentity,
    handleUnlock,
    handleLock,
    getStatusText,
    t,
  } = useIdentityActions();

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
              className="justify-start gap-2 text-primary/70 hover:text-primary min-h-[44px]"
              aria-label={t("create", "Create")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">
                {t("identity", "Identity")}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{getStatusText()}</p>
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
              className="justify-start gap-2 text-primary/70 hover:text-primary min-h-[44px]"
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
          <p>{getStatusText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default IdentityStatusCompact;
