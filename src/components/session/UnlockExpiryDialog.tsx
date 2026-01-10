/**
 * Unlock Expiry Dialog (C2 Production Model)
 * 
 * Shows NON-BLOCKING warnings when identity unlock TTL is low.
 * User can dismiss and continue working - this is informational only.
 * The bridge will auto-lock when TTL expires; UI will handle gracefully.
 */

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIdentity } from "@/features/identity";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";
import { alertWarning } from "@/lib/alerts";

// Only show toast warning - no blocking dialog
const TOAST_WARNING_SECONDS = 120; // Show toast at 2 minutes remaining
// Minimum session TTL to even consider showing warnings (prevents immediate popups)
const MIN_TTL_FOR_WARNINGS = 180; // 3 minutes - don't warn if session started with less

export function UnlockExpiryDialog() {
  const { t } = useTranslation();
  const { isUnlocked, unlockExpiresAt, isInitialized } = useIdentity();
  const { timeLeft, isExpired, formatted } = useCountdown(unlockExpiresAt);
  
  const [showExpired, setShowExpired] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  // Track if user was ever unlocked in this session - prevents showing expiry on fresh login
  const [wasEverUnlocked, setWasEverUnlocked] = useState(false);
  // Track initial TTL to avoid warning if session was short from the start
  const initialTtlRef = useRef<number | null>(null);

  // Track when user becomes unlocked and capture initial TTL
  useEffect(() => {
    if (isUnlocked && unlockExpiresAt) {
      setWasEverUnlocked(true);
      // Capture initial TTL on first unlock
      if (initialTtlRef.current === null) {
        const ttl = Math.max(0, Math.floor((new Date(unlockExpiresAt).getTime() - Date.now()) / 1000));
        initialTtlRef.current = ttl;
      }
    }
  }, [isUnlocked, unlockExpiresAt]);

  // Show toast warning at 2 minutes (non-blocking) 
  // Only if session had enough initial TTL to make warnings meaningful
  useEffect(() => {
    const hadEnoughInitialTtl = initialTtlRef.current !== null && initialTtlRef.current >= MIN_TTL_FOR_WARNINGS;
    
    if (
      wasEverUnlocked && 
      hadEnoughInitialTtl &&
      isUnlocked && 
      unlockExpiresAt && 
      timeLeft > 0 && 
      timeLeft <= TOAST_WARNING_SECONDS && 
      !toastShown
    ) {
      // Trigger warning alert (vibration + sound)
      alertWarning();
      
      toast.warning(t("sessionExpiringToast", "Session expires in 2 minutes"), {
        description: t("sessionExpiringToastDesc", "You may need to re-authenticate soon."),
        duration: 5000,
      });
      setToastShown(true);
    }
  }, [wasEverUnlocked, isUnlocked, unlockExpiresAt, timeLeft, toastShown, t]);

  // Show expired notification only (non-blocking)
  useEffect(() => {
    const hadEnoughInitialTtl = initialTtlRef.current !== null && initialTtlRef.current >= MIN_TTL_FOR_WARNINGS;
    
    if (wasEverUnlocked && hadEnoughInitialTtl && isUnlocked && unlockExpiresAt && isExpired) {
      setShowExpired(true);
    }
  }, [wasEverUnlocked, isUnlocked, unlockExpiresAt, isExpired]);

  // Reset state when identity becomes locked
  useEffect(() => {
    if (!isUnlocked && isInitialized) {
      setShowExpired(false);
      setToastShown(false);
      // Reset initial TTL tracking for next session
      initialTtlRef.current = null;
    }
  }, [isUnlocked, isInitialized]);

  // Expired dialog (session has expired) - dismissable
  if (showExpired) {
    return (
      <AlertDialog open={showExpired} onOpenChange={setShowExpired}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">
                {t("unlockExpired", "Session Expired")}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              {t(
                "unlockExpiredDescription",
                "Your identity unlock has expired. Re-authenticate to continue."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExpired(false)} 
              className="w-full sm:w-auto"
            >
              {t("dismiss", "Dismiss")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
