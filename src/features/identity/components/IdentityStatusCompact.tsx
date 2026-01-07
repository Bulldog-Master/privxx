/**
 * Compact Identity Status Component (C2 Production Model)
 * 
 * Minimal identity indicator for header/nav use.
 * Shows TTL countdown in tooltip when unlocked.
 */

import React from "react";
import { Lock, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIdentityActions } from "@/features/identity/hooks/useIdentityActions";

interface IdentityStatusCompactProps extends React.HTMLAttributes<HTMLDivElement> {}

export const IdentityStatusCompact = React.forwardRef<HTMLDivElement, IdentityStatusCompactProps>(
  ({ className, ...props }, ref) => {
    const {
      isUnlocked,
      isLoading,
      unlockExpiresAt,
      formatted,
      isExpiringSoon,
      getStatusText,
      handleLock,
      t,
    } = useIdentityActions();

    const handleClick = async () => {
      if (isUnlocked && !isLoading) {
        await handleLock();
      }
    };

    return (
      <div ref={ref} className={className} {...props}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
                onClick={handleClick}
                className={`justify-start gap-2 min-h-[44px] ${
                  isUnlocked 
                    ? isExpiringSoon 
                      ? "text-amber-500 hover:text-amber-400" 
                      : "text-emerald-500 hover:text-emerald-400"
                    : "text-primary/70 hover:text-primary"
                }`}
                aria-label={isUnlocked ? t("identityUnlocked", "Identity Unlocked") : t("identityLocked", "Identity Locked")}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : isUnlocked ? (
                  <Shield className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only sm:not-sr-only">
                  {isUnlocked && unlockExpiresAt ? formatted : t("identity", "Identity")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{getStatusText()}</p>
              {isUnlocked && <p className="text-xs text-muted-foreground">{t("clickToLock", "Click to lock")}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

IdentityStatusCompact.displayName = "IdentityStatusCompact";

export default IdentityStatusCompact;
