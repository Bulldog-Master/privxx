import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Unlock, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIdentity } from "@/contexts/IdentityContext";
import { IdentityModal } from "./IdentityModal";
import { toast } from "sonner";

export function IdentityStatus() {
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

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
        {/* Status indicator */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            isUnlocked
              ? "bg-emerald-500/10 text-emerald-500"
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
          <div className="text-sm font-medium">
            {t("identity", "Identity")}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {state === "unlocking" && t("identityUnlocking", "Unlocking...")}
            {state === "locking" && t("identityLocking", "Locking...")}
            {state === "unlocked" && t("identityReady", "Ready to send messages")}
            {state === "locked" && t("identityLockedStatus", "Unlock to send messages")}
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
            {state === "locking" ? (
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
            onClick={() => setModalOpen(true)}
            disabled={isLoading}
            className="shrink-0"
          >
            {state === "unlocking" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">{t("unlock", "Unlock")}</span>
          </Button>
        )}
      </div>

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
