/**
 * Two-Factor Authentication Management Component
 * 
 * Allows users to enable, verify, and disable 2FA with TOTP.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { useTOTP } from "@/hooks/useTOTP";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface TOTPManagementProps {
  userId: string;
}

export function TOTPManagement({ userId }: TOTPManagementProps) {
  const { t } = useTranslation();
  const { getStatus, startSetup, verifyCode, disable, isLoading, error, clearError } = useTOTP();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    const status = await getStatus();
    if (status) {
      setIsEnabled(status.enabled);
    }
    setIsChecking(false);
  }, [getStatus]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleStartSetup = async () => {
    clearError();
    setQrCodeDataUrl(null);
    const data = await startSetup();
    if (data) {
      setSetupData(data);
      setVerificationCode("");
      // Generate QR code from otpauth URL
      try {
        const dataUrl = await QRCode.toDataURL(data.otpauthUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error(t("invalidCodeLength", "Code must be 6 digits"));
      return;
    }

    const result = await verifyCode(verificationCode);
    if (result?.verified) {
      if (result.backupCodes) {
        setBackupCodes(result.backupCodes);
      } else {
        toast.success(t("codeVerified", "Code verified"));
        setSetupData(null);
        setIsEnabled(true);
      }
    }
  };

  const handleBackupCodesSaved = () => {
    setBackupCodes(null);
    setSetupData(null);
    setIsEnabled(true);
    toast.success(t("twoFactorEnabled", "Two-factor authentication enabled"));
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast.error(t("invalidCodeLength", "Code must be 6 digits"));
      return;
    }

    const success = await disable(disableCode);
    if (success) {
      setIsEnabled(false);
      setShowDisableDialog(false);
      setDisableCode("");
      toast.success(t("twoFactorDisabled", "Two-factor authentication disabled"));
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    await navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  if (isChecking) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("twoFactorAuth", "Two-Factor Authentication")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            {t("twoFactorAuth", "Two-Factor Authentication")}
          </CardTitle>
          <CardDescription>
            {t("twoFactorDescription", "Add an extra layer of security using an authenticator app like Google Authenticator or Authy.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{t("twoFactorActive", "Two-factor authentication is active")}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                {t("disable2FA", "Disable 2FA")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("twoFactorNotEnabled", "Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.")}
              </p>
              <Button onClick={handleStartSetup} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {t("enable2FA", "Enable 2FA")}
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={!!setupData && !backupCodes} onOpenChange={(open) => !open && setSetupData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("setup2FA", "Set Up Two-Factor Authentication")}</DialogTitle>
            <DialogDescription>
              {t("setup2FADescription", "Scan the QR code with your authenticator app, or enter the secret key manually.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt={t("totpQRCode", "TOTP QR Code")} 
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 bg-muted flex items-center justify-center rounded animate-pulse">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                {t("scanWithAuthApp", "Scan with your authenticator app")}
              </p>
            </div>

            {/* Manual entry */}
            <div className="space-y-2">
              <Label>{t("secretKey", "Secret Key")}</Label>
              <div className="flex gap-2">
                <Input
                  value={setupData?.secret || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setupData && copyToClipboard(setupData.secret, 'secret')}
                >
                  {copiedSecret ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <Label>{t("verificationCode", "Verification Code")}</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t("verifyAndEnable", "Verify & Enable")}
            </Button>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={!!backupCodes} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("saveBackupCodes", "Save Your Backup Codes")}
            </DialogTitle>
            <DialogDescription>
              {t("backupCodesDescription", "Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes?.map((code, i) => (
                <div key={i} className="text-center">{code}</div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => backupCodes && copyToClipboard(backupCodes.join('\n'), 'backup')}
              className="w-full"
            >
              {copiedBackup ? (
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedBackup ? t("copied", "Copied!") : t("copyAllCodes", "Copy All Codes")}
            </Button>
            <Button onClick={handleBackupCodesSaved} className="w-full">
              {t("iSavedMyCodes", "I've Saved My Codes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disable2FATitle", "Disable Two-Factor Authentication?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("disable2FAWarning", "Enter your current 2FA code to disable two-factor authentication. This will make your account less secure.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>{t("currentCode", "Current 2FA Code")}</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-widest mt-2"
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDisableCode(""); clearError(); }}>
              {t("cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={isLoading || disableCode.length !== 6}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldOff className="h-4 w-4 mr-2" />
              )}
              {t("disable", "Disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
