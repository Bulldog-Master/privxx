/**
 * Shared Identity Actions Hook
 * 
 * Extracts common identity action handlers used by IdentityStatus components.
 * Simplified for new unlock API that requires a password.
 */

import { useTranslation } from "react-i18next";
import { useIdentity } from "@/features/identity/context/IdentityContext";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";

export function useIdentityActions() {
  const { t } = useTranslation();
  const { 
    state, 
    isLocked, 
    isUnlocked, 
    isLoading, 
    unlockExpiresAt, 
    unlock,
    lock,
  } = useIdentity();
  
  const { formatted, timeLeft, isExpired } = useCountdown(unlockExpiresAt);

  const handleUnlock = async (password: string) => {
    const success = await unlock(password);
    if (success) {
      toast.success(t("identityUnlocked", "Identity unlocked"));
    }
    return success;
  };

  const handleLock = async () => {
    const success = await lock();
    if (success) {
      toast.success(t("identityLocked", "Identity locked"));
    }
    return success;
  };

  const getStatusText = () => {
    if (isLoading) return t("identityLoading", "Loading...");
    if (isUnlocked && unlockExpiresAt) {
      return t("sessionExpiresIn", "Session expires in {{time}}", { time: formatted });
    }
    if (isUnlocked) return t("identityReady", "Ready to send messages");
    return t("identityLockedStatus", "Unlock to send messages");
  };

  // Determine if session is expiring soon (under 2 minutes)
  const isExpiringSoon = isUnlocked && timeLeft > 0 && timeLeft < 120;

  return {
    // State
    state,
    isLocked,
    isUnlocked,
    isLoading,
    unlockExpiresAt,
    formatted,
    timeLeft,
    isExpired,
    isExpiringSoon,
    // Actions
    handleUnlock,
    handleLock,
    getStatusText,
    t,
  };
}

export default useIdentityActions;
