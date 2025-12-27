/**
 * Session Timeout Warning Dialog
 * 
 * Displays a warning when the user's session is about to expire.
 */

import { useTranslation } from "react-i18next";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionTimeoutWarningProps {
  open: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({
  open,
  secondsRemaining,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const { t } = useTranslation();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t("sessionExpiring", "Session Expiring")}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            {t(
              "sessionExpiringDescription",
              "You've been inactive for a while. For your security, you'll be logged out soon."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-1">
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-sm text-primary/60">
              {t("untilLogout", "until automatic logout")}
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            {t("logoutNow", "Logout Now")}
          </Button>
          <Button onClick={onExtend} className="w-full sm:w-auto">
            {t("stayLoggedIn", "Stay Logged In")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
