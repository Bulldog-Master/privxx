/**
 * TOTP 2FA Hook
 * 
 * Provides TOTP setup, verification, and management functionality.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TOTPStatus {
  enabled: boolean;
  verifiedAt: string | null;
  createdAt: string | null;
}

interface TOTPSetupData {
  secret: string;
  otpauthUrl: string;
  qrData: string;
}

interface TOTPState {
  isLoading: boolean;
  error: string | null;
}

export function useTOTP() {
  const [state, setState] = useState<TOTPState>({
    isLoading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const normalizeError = useCallback((raw: string, fallback: string) => {
    return raw || fallback;
  }, []);

  const extractInvokeErrorMessage = useCallback((err: unknown, fallback: string) => {
    const anyErr = err as any;

    // Supabase Functions errors often carry useful context (status/body) but end up as "non-2xx status code".
    const status = anyErr?.context?.status ?? anyErr?.status;
    const bodyError = anyErr?.context?.body?.error;
    const msg = typeof anyErr?.message === "string" ? anyErr.message : "";

    // Prefer server-provided error string when present.
    const best = (typeof bodyError === "string" && bodyError) ? bodyError : msg;

    if (best) {
      return status ? `${best} (HTTP ${status})` : best;
    }

    return status ? `${fallback} (HTTP ${status})` : fallback;
  }, []);

  /**
   * Get current 2FA status
   */
  const getStatus = useCallback(async (): Promise<TOTPStatus | null> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke("totp-auth", {
        body: { action: "status" },
      });

      // IMPORTANT: throw the original invoke error to preserve status/body context
      if (error) throw error;

      setState({ isLoading: false, error: null });
      return data as TOTPStatus;
    } catch (error) {
      const message = extractInvokeErrorMessage(error, "Failed to get 2FA status");
      console.error("[useTOTP] getStatus error:", error);
      setState({ isLoading: false, error: message });
      return null;
    }
  }, [extractInvokeErrorMessage]);

  /**
   * Start 2FA setup - returns secret and QR code data
   */
  const startSetup = useCallback(async (): Promise<TOTPSetupData | null> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke("totp-auth", {
        body: { action: "setup" },
      });

      // IMPORTANT: throw the original invoke error to preserve status/body context
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setState({ isLoading: false, error: null });
      return data as TOTPSetupData;
    } catch (error) {
      const message = extractInvokeErrorMessage(error, "Failed to start 2FA setup");
      console.error("[useTOTP] startSetup error:", error);
      setState({ isLoading: false, error: message });
      return null;
    }
  }, [extractInvokeErrorMessage]);

  /**
   * Verify TOTP code and complete setup
   */
  const verifyCode = useCallback(
    async (code: string): Promise<{ verified: boolean; backupCodes?: string[] } | null> => {
      setState({ isLoading: true, error: null });

      try {
        const { data, error } = await supabase.functions.invoke("totp-auth", {
          body: { action: "verify", code },
        });

        // IMPORTANT: throw the original invoke error to preserve status/body context
        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setState({ isLoading: false, error: null });
        return data;
      } catch (error) {
        const message = extractInvokeErrorMessage(error, "Verification failed");
        setState({ isLoading: false, error: message });
        return null;
      }
    },
    [extractInvokeErrorMessage]
  );

  /**
   * Disable 2FA (requires current TOTP code)
   */
  const disable = useCallback(
    async (code: string): Promise<boolean> => {
      setState({ isLoading: true, error: null });

      try {
        const { data, error } = await supabase.functions.invoke("totp-auth", {
          body: { action: "disable", code },
        });

        // IMPORTANT: throw the original invoke error to preserve status/body context
        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setState({ isLoading: false, error: null });
        return true;
      } catch (error) {
        const message = extractInvokeErrorMessage(error, "Failed to disable 2FA");
        setState({ isLoading: false, error: message });
        return false;
      }
    },
    [extractInvokeErrorMessage]
  );

  /**
   * Verify backup code
   */
  const verifyBackupCode = useCallback(
    async (code: string): Promise<boolean> => {
      setState({ isLoading: true, error: null });

      try {
        const { data, error } = await supabase.functions.invoke("totp-auth", {
          body: { action: "verify-backup", code },
        });

        // IMPORTANT: throw the original invoke error to preserve status/body context
        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setState({ isLoading: false, error: null });
        return data.verified;
      } catch (error) {
        const message = extractInvokeErrorMessage(error, "Invalid backup code");
        setState({ isLoading: false, error: message });
        return false;
      }
    },
    [extractInvokeErrorMessage]
  );

  return {
    ...state,
    getStatus,
    startSetup,
    verifyCode,
    disable,
    verifyBackupCode,
    clearError,
  };
}
