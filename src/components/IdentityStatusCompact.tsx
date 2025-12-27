import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Unlock, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdentity } from "@/contexts/IdentityContext";
import { IdentityModal } from "./IdentityModal";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IdentityStatusCompact() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const { state, isLocked, isUnlocked, isLoading, error, unlock, lock, clearError } = useIdentity();

  const handleLock = async () => {
    const success = await lock();
    if (success) {
      toast.success(t("identityLocked", "Identity locked"));
    }
  };

  const handleUnlock = async (password: string) => {
    const success = await unlock(password);
    if (success) {
      toast.success(t("identityUnlocked", "Identity unlocked"));
    }
    return success;
  };

  const getTooltipText = () => {
    if (state === "unlocking") return t("identityUnlocking", "Unlocking...");
    if (state === "locking") return t("identityLocking", "Locking...");
    if (isUnlocked) return t("identityReady", "Ready to send messages");
    return t("identityLockedStatus", "Unlock to send messages");
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {isUnlocked ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLock}
                disabled={isLoading}
                className="justify-start gap-2 text-emerald-500 hover:text-emerald-400 min-h-[44px]"
                aria-label={t("lock", "Lock")}
              >
                {state === "locking" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Shield className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only sm:not-sr-only">
                  {t("identity", "Identity")}
                </span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(true)}
                disabled={isLoading}
                className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
                aria-label={t("unlock", "Unlock")}
              >
                {state === "unlocking" ? (
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

      <IdentityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUnlock={handleUnlock}
        isLoading={state === "unlocking"}
        error={error}
        onClearError={clearError}
      />
    </>
  );
}

export default IdentityStatusCompact;
