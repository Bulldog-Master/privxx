/**
 * Trusted Device Bypass Indicator Component
 * 
 * Shows when 2FA was skipped due to trusted device status.
 * Allows users to manually verify anyway.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert, KeyRound, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrustedDeviceBypassIndicatorProps {
  deviceName: string;
  onVerifyManually?: (code: string) => Promise<boolean>;
  onDismiss?: () => void;
}

export function TrustedDeviceBypassIndicator({
  deviceName,
  onVerifyManually,
  onDismiss,
}: TrustedDeviceBypassIndicatorProps) {
  const { t } = useTranslation("ui");
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!onVerifyManually || code.length < 6) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const success = await onVerifyManually(code);
      if (success) {
        setShowVerifyDialog(false);
        onDismiss?.();
      } else {
        setError(t("invalidCode", "Invalid verification code"));
      }
    } catch {
      setError(t("verificationFailed", "Verification failed. Please try again."));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Alert className="border-green-500/30 bg-green-500/5">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">
          {t("trustedDeviceBypass", "Trusted Device")}
        </AlertTitle>
        <AlertDescription className="text-sm">
          <p className="text-muted-foreground mb-2">
            {t("trustedDeviceBypassDesc", "2FA was skipped because \"{{device}}\" is a trusted device.", { device: deviceName })}
          </p>
          <div className="flex items-center gap-2">
            {onVerifyManually && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVerifyDialog(true)}
                className="text-xs h-7"
              >
                <KeyRound className="h-3 w-3 mr-1.5" />
                {t("verifyAnyway", "Verify anyway")}
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs h-7"
              >
                {t("dismiss", "Dismiss")}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              {t("manualVerification", "Manual Verification")}
            </DialogTitle>
            <DialogDescription>
              {t("manualVerificationDesc", "Enter your 2FA code to verify manually, even though this device is trusted.")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="totp-code">{t("verificationCode", "Verification code")}</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowVerifyDialog(false)}
                disabled={isVerifying}
              >
                {t("cancel", "Cancel")}
              </Button>
              <Button
                onClick={handleVerify}
                disabled={code.length < 6 || isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                {t("verify", "Verify")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
