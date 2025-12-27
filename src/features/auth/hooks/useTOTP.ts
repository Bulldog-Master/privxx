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
    setState(s => ({ ...s, error: null }));
  }, []);

  /**
   * Get current 2FA status
   */
  const getStatus = useCallback(async (): Promise<TOTPStatus | null> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('totp-auth', {
        body: { action: 'status' },
      });

      if (error) throw new Error(error.message);
      setState({ isLoading: false, error: null });
      return data as TOTPStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get 2FA status';
      setState({ isLoading: false, error: message });
      return null;
    }
  }, []);

  /**
   * Start 2FA setup - returns secret and QR code data
   */
  const startSetup = useCallback(async (): Promise<TOTPSetupData | null> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('totp-auth', {
        body: { action: 'setup' },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setState({ isLoading: false, error: null });
      return data as TOTPSetupData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start 2FA setup';
      setState({ isLoading: false, error: message });
      return null;
    }
  }, []);

  /**
   * Verify TOTP code and complete setup
   */
  const verifyCode = useCallback(async (code: string): Promise<{ verified: boolean; backupCodes?: string[] } | null> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('totp-auth', {
        body: { action: 'verify', code },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setState({ isLoading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setState({ isLoading: false, error: message });
      return null;
    }
  }, []);

  /**
   * Disable 2FA (requires current TOTP code)
   */
  const disable = useCallback(async (code: string): Promise<boolean> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('totp-auth', {
        body: { action: 'disable', code },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setState({ isLoading: false, error: null });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
      setState({ isLoading: false, error: message });
      return false;
    }
  }, []);

  /**
   * Verify backup code
   */
  const verifyBackupCode = useCallback(async (code: string): Promise<boolean> => {
    setState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('totp-auth', {
        body: { action: 'verify-backup', code },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setState({ isLoading: false, error: null });
      return data.verified;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid backup code';
      setState({ isLoading: false, error: message });
      return false;
    }
  }, []);

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
