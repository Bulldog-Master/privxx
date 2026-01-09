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
  const registerPasskey = useCallback(async () => {
    setState({ isLoading: true, error: null });

    try {
      // Get registration options from edge function (JWT validated server-side)
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('passkey-auth', {
        body: { action: 'registration-options' },
      });

      // IMPORTANT: throw the original invoke error to preserve status/body context
      if (optionsError || !optionsData?.options) {
        throw optionsError || new Error('Failed to get registration options');
      }

      console.log('[usePasskey] Starting registration...');

      // Start WebAuthn registration
      const credential = await startRegistration({
        optionsJSON: optionsData.options,
      });

      // Verify and store credential (JWT validated server-side)
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('passkey-auth', {
        body: {
          action: 'registration-verify',
          credential: {
            id: credential.id,
            rawId: credential.rawId,
            response: credential.response,
            authenticatorAttachment: credential.authenticatorAttachment,
            clientExtensionResults: credential.clientExtensionResults,
            type: credential.type,
          },
        },
      });

      // IMPORTANT: throw the original invoke error to preserve status/body context
      if (verifyError || !verifyData?.success) {
        throw verifyError || new Error('Failed to verify registration');
      }

      console.log('[usePasskey] Passkey registered successfully');
      setState({ isLoading: false, error: null });
      return true;
    } catch (error) {
      const anyErr = error as any;
      const status = anyErr?.context?.status ?? anyErr?.status;
      const bodyError = anyErr?.context?.body?.error;
      const raw = typeof bodyError === "string" && bodyError
        ? bodyError
        : (error instanceof Error ? error.message : "");

      const message = raw
        ? (status ? `${raw} (HTTP ${status})` : raw)
        : (status ? `Passkey registration failed (HTTP ${status})` : "Passkey registration failed");

      console.error('[usePasskey] Registration error:', error);
      setState({ isLoading: false, error: message });
      return false;
    }
  }, []);

  /**
   * Authenticate with a passkey
   * If email is omitted, uses discoverable (usernameless) credentials.
   */
  const authenticateWithPasskey = useCallback(async (inputEmail?: string | null) => {
    setState({ isLoading: true, error: null });

    try {
      // Get authentication options
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke('passkey-auth', {
        body: { action: 'authentication-options', ...(inputEmail ? { email: inputEmail } : {}) },
      });

      // IMPORTANT: throw the original invoke error to preserve status/body context
      if (optionsError || !optionsData?.options) {
        throw optionsError || new Error(optionsData?.error || 'Failed to get authentication options');
      }

      console.log('[usePasskey] Starting authentication...');

      // Start WebAuthn authentication
      const credential = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      // Verify authentication (send full credential response)
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('passkey-auth', {
        body: {
          action: 'authentication-verify',
          ...(inputEmail ? { email: inputEmail } : {}),
          credential: {
            id: credential.id,
            rawId: credential.rawId,
            response: credential.response,
            authenticatorAttachment: credential.authenticatorAttachment,
            clientExtensionResults: credential.clientExtensionResults,
            type: credential.type,
          },
        },
      });

      // IMPORTANT: throw the original invoke error to preserve status/body context
      if (verifyError || !verifyData?.success) {
        throw verifyError || new Error('Authentication failed');
      }

      // Use the token to sign in - handle both tokenHash and token formats
      const tokenHash = verifyData.tokenHash || verifyData.token;
      const resolvedEmail = verifyData.email;
      
      if (tokenHash && resolvedEmail) {
        // Use verifyOtp with email + token_hash for proper session creation
        const { error: sessionError } = await supabase.auth.verifyOtp({
          email: resolvedEmail,
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (sessionError) {
          console.error('[usePasskey] Session creation failed:', sessionError);
          throw new Error(sessionError.message);
        }
      } else if (tokenHash) {
        // Fallback: try without email (less reliable)
        const { error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (sessionError) {
          console.error('[usePasskey] Session creation failed (no email):', sessionError);
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

  /**
   * Check if the device/browser likely supports usernameless (discoverable) passkey sign-in.
   * We treat either a platform authenticator OR conditional mediation as sufficient.
   */
  const checkDiscoverableSupport = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const uvpaa = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      const cma = typeof (PublicKeyCredential as any).isConditionalMediationAvailable === "function"
        ? await (PublicKeyCredential as any).isConditionalMediationAvailable()
        : false;
      return Boolean(uvpaa || cma);
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
    checkDiscoverableSupport,
    clearError,
  };
}
