/**
 * Unlock Expiry Dialog (C2 Production Model)
 * 
 * Prompts re-authentication when identity unlock TTL expires.
 * Includes haptic/audio alerts for mobile devices.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Loader2 } from "lucide-react";
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
import { alertWarning, alertUrgent } from "@/lib/alerts";

const WARNING_THRESHOLD_SECONDS = 60; // Show dialog at 1 minute remaining
const TOAST_WARNING_SECONDS = 120; // Show toast at 2 minutes remaining

export function UnlockExpiryDialog() {
  const { t } = useTranslation();
  const { isUnlocked, unlockExpiresAt, unlock, lock, isLoading } = useIdentity();
  const { timeLeft, isExpired, formatted } = useCountdown(unlockExpiresAt);
  
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  // Show toast warning at 2 minutes (with haptic feedback)
  useEffect(() => {
    if (isUnlocked && unlockExpiresAt && timeLeft > 0 && timeLeft <= TOAST_WARNING_SECONDS && timeLeft > WARNING_THRESHOLD_SECONDS && !toastShown) {
      // Trigger warning alert (vibration + sound)
      alertWarning();
      
      toast.warning(t("sessionExpiringToast", "Your session expires in 2 minutes"), {
        description: t("sessionExpiringToastDesc", "Extend your session to continue messaging."),
        duration: 5000,
      });
      setToastShown(true);
    }
  }, [isUnlocked, unlockExpiresAt, timeLeft, toastShown, t]);

  // Show dialog when under 1 minute (with urgent alert)
  useEffect(() => {
    if (isUnlocked && unlockExpiresAt && timeLeft > 0 && timeLeft <= WARNING_THRESHOLD_SECONDS) {
      if (!showWarning) {
        // Trigger urgent alert when dialog first appears
        alertUrgent();
      }
      setShowWarning(true);
      setShowExpired(false);
    }
  }, [isUnlocked, unlockExpiresAt, timeLeft, showWarning]);

  // Show expired dialog when TTL reaches 0 (with urgent alert)
  useEffect(() => {
    if (isUnlocked && unlockExpiresAt && isExpired) {
      alertUrgent();
      setShowWarning(false);
      setShowExpired(true);
    }
  }, [isUnlocked, unlockExpiresAt, isExpired]);

  // Reset state when identity state changes
  useEffect(() => {
    if (!isUnlocked) {
      setShowWarning(false);
      setShowExpired(false);
      setToastShown(false);
    }
  }, [isUnlocked]);

  const handleExtendSession = async () => {
    setIsReauthing(true);
    const success = await unlock();
    setIsReauthing(false);
    
    if (success) {
      setShowWarning(false);
      setShowExpired(false);
      toast.success(t("sessionExtended", "Session extended"));
    } else {
      toast.error(t("sessionExtendFailed", "Failed to extend session"));
    }
  };

  const handleLock = async () => {
    await lock();
    setShowWarning(false);
    setShowExpired(false);
  };

  // Warning dialog (session expiring soon)
  if (showWarning && !showExpired) {
    return (
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-amber-500" />
              </div>
              <AlertDialogTitle className="text-xl">
                {t("unlockExpiring", "Session Expiring")}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              {t(
                "unlockExpiringDescription",
                "Your identity unlock will expire soon. Re-authenticate to continue using secure messaging."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-500 mb-1">
                {formatted}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("untilLock", "until identity locks")}
              </p>
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleLock} 
              disabled={isReauthing || isLoading}
              className="w-full sm:w-auto"
            >
              <Lock className="h-4 w-4 mr-2" />
              {t("lockNow", "Lock Now")}
            </Button>
            <Button 
              onClick={handleExtendSession} 
              disabled={isReauthing || isLoading}
              className="w-full sm:w-auto"
            >
              {isReauthing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {t("extendSession", "Extend Session")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Expired dialog (session has expired)
  if (showExpired) {
    return (
      <AlertDialog open={showExpired}>
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
                "Your identity unlock has expired. Please re-authenticate to continue."
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
            <Button 
              onClick={handleExtendSession} 
              disabled={isReauthing || isLoading}
              className="w-full sm:w-auto"
            >
              {isReauthing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {t("reAuthenticate", "Re-authenticate")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
