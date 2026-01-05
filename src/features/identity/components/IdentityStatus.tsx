/**
 * Identity Status Component (C2 Production Model)
 * 
 * Displays identity state (locked/unlocked).
 * Note: Unlock requires password and is handled separately.
 */

import React from "react";
import { Lock, Loader2, Shield, Clock } from "lucide-react";
import { useIdentityActions } from "@/features/identity/hooks/useIdentityActions";

interface IdentityStatusProps extends React.HTMLAttributes<HTMLDivElement> {}

export const IdentityStatus = React.forwardRef<HTMLDivElement, IdentityStatusProps>(
  ({ className, ...props }, ref) => {
    const {
      isUnlocked,
      isLoading,
      unlockExpiresAt,
      formatted,
      isExpiringSoon,
      t,
    } = useIdentityActions();

    return (
      <div ref={ref} className={`flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 ${className || ""}`} {...props}>
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
            {!isUnlocked && !isLoading && t("identityLockedStatus", "Unlock to send messages")}
          </div>
        </div>
      </div>
    );
  }
);

IdentityStatus.displayName = "IdentityStatus";
