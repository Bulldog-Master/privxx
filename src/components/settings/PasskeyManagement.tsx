/**
 * Passkey Management Component
 * 
 * Allows users to register, view, and delete passkeys.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Fingerprint, Plus, Trash2, Loader2, KeyRound, Smartphone, Monitor, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePasskey } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDistanceToNow } from "date-fns";

interface Passkey {
  id: string;
  credential_id: string;
  device_type: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface PasskeyManagementProps {
  userId: string;
  email: string;
}

export function PasskeyManagement({ userId, email }: PasskeyManagementProps) {
  const { t } = useTranslation();
  const { isSupported, registerPasskey, isLoading: registering, error: registerError, checkPlatformAuthenticator, clearError } = usePasskey();

  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);

  const fetchPasskeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('passkey_credentials')
        .select('id, credential_id, device_type, created_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPasskeys(data || []);
    } catch (error) {
      console.error('[PasskeyManagement] Failed to fetch passkeys:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPasskeys();
    checkPlatformAuthenticator().then(setHasPlatformAuth);
  }, [fetchPasskeys, checkPlatformAuthenticator]);

  const handleRegister = async () => {
    clearError();
    const success = await registerPasskey(userId, email);
    if (success) {
      toast.success(t("passkeyRegistered", "Passkey registered successfully"));
      fetchPasskeys();
    } else if (registerError) {
      toast.error(registerError);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('passkey_credentials')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success(t("passkeyDeleted", "Passkey deleted"));
      setPasskeys(p => p.filter(pk => pk.id !== deleteId));
    } catch (error) {
      console.error('[PasskeyManagement] Failed to delete passkey:', error);
      toast.error(t("passkeyDeleteError", "Failed to delete passkey"));
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === 'platform' || deviceType === 'hybrid') {
      return <Smartphone className="h-5 w-5" />;
    }
    return <KeyRound className="h-5 w-5" />;
  };

  const getDeviceLabel = (deviceType: string | null) => {
    switch (deviceType) {
      case 'platform':
        return t("platformAuthenticator", "Device (Touch ID / Face ID / Windows Hello)");
      case 'cross-platform':
        return t("securityKey", "Security Key");
      case 'hybrid':
        return t("hybridAuthenticator", "Phone or Tablet");
      default:
        return t("unknownDevice", "Unknown Device");
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Fingerprint className="h-5 w-5" />
            {t("passkeys", "Passkeys")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-primary/70">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              {t("webauthnNotSupported", "Passkeys are not supported in this browser.")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Fingerprint className="h-5 w-5" />
            {t("passkeys", "Passkeys")}
          </CardTitle>
          <CardDescription className="text-primary/70">
            {t("passkeysDescription", "Use Touch ID, Face ID, Windows Hello, or security keys to sign in without a password.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform authenticator status */}
          {hasPlatformAuth && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              {t("platformAuthAvailable", "Your device supports biometric authentication")}
            </div>
          )}

          {/* Existing passkeys */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
            </div>
          ) : passkeys.length === 0 ? (
            <div className="text-center py-6 text-primary/70">
              <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t("noPasskeys", "No passkeys registered yet")}</p>
              <p className="text-xs mt-1">{t("addPasskeyHint", "Add a passkey for passwordless sign-in")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      {getDeviceIcon(passkey.device_type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {getDeviceLabel(passkey.device_type)}
                      </p>
                      <p className="text-xs text-primary/70">
                        {t("addedOn", "Added")} {formatDistanceToNow(new Date(passkey.created_at), { addSuffix: true })}
                        {passkey.last_used_at && (
                          <> · {t("lastUsed", "Last used")} {formatDistanceToNow(new Date(passkey.last_used_at), { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(passkey.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Register button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleRegister}
              disabled={registering}
              className="w-full sm:w-auto"
            >
              {registering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {t("addPasskey", "Add Passkey")}
            </Button>
            {registerError && (
              <p className="text-sm text-destructive mt-2">{registerError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePasskey", "Delete Passkey?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePasskeyWarning", "This passkey will be removed and you won't be able to use it to sign in anymore. This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t("delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
