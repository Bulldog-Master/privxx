/**
 * Passkey (WebAuthn) Hook
 * 
 * Provides passkey registration and authentication functionality.
 */

import { useState, useCallback } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";

interface PasskeyState {
  isLoading: boolean;
  error: string | null;
}

export function usePasskey() {
  const [state, setState] = useState<PasskeyState>({
    isLoading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  /**
   * Register a new passkey for the current logged-in user
   */
  const registerPasskey = useCallback(async (userId: string, email: string) => {
    setState({ isLoading: true, error: null });

    try {
      // Get registration options from edge function
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('passkey-auth', {
        body: { action: 'registration-options', userId, email },
      });

      if (optionsError || !optionsData?.options) {
        throw new Error(optionsError?.message || 'Failed to get registration options');
      }

      console.log('[usePasskey] Starting registration...');

      // Start WebAuthn registration
      const credential = await startRegistration({
        optionsJSON: optionsData.options,
      });

      // Verify and store credential
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('passkey-auth', {
        body: {
          action: 'registration-verify',
          userId,
          email,
          credential: {
            id: credential.id,
            publicKey: credential.response.publicKey,
            counter: 0,
            deviceType: credential.authenticatorAttachment || 'platform',
            backedUp: credential.clientExtensionResults?.credProps?.rk || false,
            transports: credential.response.transports || [],
          },
        },
      });

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || 'Failed to verify registration');
      }

      console.log('[usePasskey] Passkey registered successfully');
      setState({ isLoading: false, error: null });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passkey registration failed";
      console.error('[usePasskey] Registration error:', error);
      setState({ isLoading: false, error: message });
      return false;
    }
  }, []);

  /**
   * Authenticate with a passkey
   */
  const authenticateWithPasskey = useCallback(async (email: string) => {
    setState({ isLoading: true, error: null });

    try {
      // Get authentication options
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('passkey-auth', {
        body: { action: 'authentication-options', email },
      });

      if (optionsError || !optionsData?.options) {
        throw new Error(optionsError?.message || optionsData?.error || 'Failed to get authentication options');
      }

      console.log('[usePasskey] Starting authentication...');

      // Start WebAuthn authentication
      const credential = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      // Verify authentication
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('passkey-auth', {
        body: {
          action: 'authentication-verify',
          email,
          credential: {
            id: credential.id,
            counter: 0,
          },
        },
      });

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || 'Authentication failed');
      }

      // Use the token to sign in
      if (verifyData.token) {
        const { error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: verifyData.token,
          type: 'magiclink',
        });

        if (sessionError) {
          throw new Error(sessionError.message);
        }
      }

      console.log('[usePasskey] Authentication successful');
      setState({ isLoading: false, error: null });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Passkey authentication failed";
      console.error('[usePasskey] Authentication error:', error);
      setState({ isLoading: false, error: message });
      return false;
    }
  }, []);

  /**
   * Check if WebAuthn is supported
   */
  const isSupported = typeof window !== 'undefined' && 
    window.PublicKeyCredential !== undefined;

  /**
   * Check if platform authenticator is available (Touch ID, Face ID, Windows Hello)
   */
  const checkPlatformAuthenticator = useCallback(async () => {
    if (!isSupported) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }, [isSupported]);

  return {
    ...state,
    isSupported,
    registerPasskey,
    authenticateWithPasskey,
    checkPlatformAuthenticator,
    clearError,
  };
}
