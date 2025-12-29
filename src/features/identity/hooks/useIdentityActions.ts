/**
 * Shared Identity Actions Hook
 * 
 * Extracts common identity action handlers used by IdentityStatus components.
 */

import { useTranslation } from "react-i18next";
import { useIdentity } from "@/features/identity/context/IdentityContext";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";

export function useIdentityActions() {
  const { t } = useTranslation();
  const { 
    state, 
    isNone, 
    isLocked, 
    isUnlocked, 
    isLoading, 
    unlockExpiresAt, 
    createIdentity, 
    unlock, 
    lock 
  } = useIdentity();
  
  const { formatted, timeLeft, isExpired } = useCountdown(unlockExpiresAt);

  const handleCreateIdentity = async () => {
    const success = await createIdentity();
    if (success) {
      toast.success(t("identityCreated", "Secure identity created"));
    }
    return success;
  };

  const handleUnlock = async () => {
    const success = await unlock();
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
    if (isNone) return t("identityNoneStatus", "Create your secure identity");
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
    isNone,
    isLocked,
    isUnlocked,
    isLoading,
    unlockExpiresAt,
    formatted,
    timeLeft,
    isExpired,
    isExpiringSoon,
    // Actions
    handleCreateIdentity,
    handleUnlock,
    handleLock,
    getStatusText,
    t,
  };
}

export default useIdentityActions;
