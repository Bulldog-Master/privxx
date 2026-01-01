/**
 * 2FA Recovery Codes Management
 * 
 * View and regenerate backup codes with strong warnings.
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Key, Copy, Check, RefreshCw, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSecurityNotify } from "@/hooks/useSecurityNotify";

interface RecoveryCodesManagementProps {
  userId: string;
  is2FAEnabled: boolean;
}

export function RecoveryCodesManagement({ userId, is2FAEnabled }: RecoveryCodesManagementProps) {
  const { t } = useTranslation();
  const { notify } = useSecurityNotify();
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerateCodes = useCallback(async () => {
    if (verificationCode.length !== 6) {
      setError(t("invalidCodeLength", "Code must be 6 digits"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("totp-auth", {
        body: { action: "backup-codes", code: verificationCode },
      });

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      if (data?.backupCodes) {
        setBackupCodes(data.backupCodes);
        setShowRegenerateDialog(false);
        setShowCodesDialog(true);
        setVerificationCode("");
        toast.success(t("recoveryCodes.regenerated", "Backup codes regenerated"));
        notify("recovery_codes_regenerated").catch(console.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate codes";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode, t]);

  const copyAllCodes = useCallback(async () => {
    if (!backupCodes) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    toast.success(t("copied", "Copied!"));
    setTimeout(() => setCopied(false), 2000);
  }, [backupCodes, t]);

  if (!is2FAEnabled) {
    return null;
  }

  return (
    <>
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="h-5 w-5" />
            {t("recoveryCodes.title", "Recovery Codes")}
          </CardTitle>
          <CardDescription className="text-primary/70">
            {t("recoveryCodes.description", "Use these codes if you lose access to your authenticator app.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-500">
                <p className="font-medium">{t("recoveryCodes.warningTitle", "Keep these codes safe")}</p>
                <p className="mt-1">
                  {t("recoveryCodes.warningBody", "Each code can only be used once. Store them in a secure location like a password manager.")}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowRegenerateDialog(true)}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("recoveryCodes.regenerate", "Regenerate Backup Codes")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("recoveryCodes.regenerateNote", "Regenerating codes will invalidate all previous codes.")}
          </p>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("recoveryCodes.regenerateTitle", "Regenerate Recovery Codes?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("recoveryCodes.regenerateWarning", "This will invalidate all your existing backup codes. You'll need to save the new codes immediately.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>{t("recoveryCodes.enterCode", "Enter your current 2FA code")}</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setVerificationCode(""); setError(null); }}>
              {t("cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={regenerateCodes}
              disabled={isLoading || verificationCode.length !== 6}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {t("recoveryCodes.confirmRegenerate", "Regenerate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Codes Dialog */}
      <Dialog open={showCodesDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("recoveryCodes.newCodesTitle", "Save Your New Backup Codes")}
            </DialogTitle>
            <DialogDescription>
              {t("recoveryCodes.newCodesDesc", "These codes replace all previous backup codes. Save them now — you won't see them again.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <div className={`grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm ${!showCodes ? "blur-sm select-none" : ""}`}>
                {backupCodes?.map((code, i) => (
                  <div key={i} className="text-center">{code}</div>
                ))}
              </div>
              {!showCodes && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button variant="outline" size="sm" onClick={() => setShowCodes(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("recoveryCodes.reveal", "Reveal Codes")}
                  </Button>
                </div>
              )}
            </div>

            {showCodes && (
              <Button variant="outline" size="sm" onClick={() => setShowCodes(false)} className="w-full">
                <EyeOff className="h-4 w-4 mr-2" />
                {t("recoveryCodes.hide", "Hide Codes")}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={copyAllCodes}
              className="w-full"
            >
              {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? t("copied", "Copied!") : t("copyAllCodes", "Copy All Codes")}
            </Button>

            <Button onClick={() => { setShowCodesDialog(false); setBackupCodes(null); setShowCodes(false); }} className="w-full">
              {t("recoveryCodes.saved", "I've Saved My Codes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
