/**
 * Identity Context (C2 Production Model)
 * 
 * Manages XX Network identity state via Bridge API.
 * Identity unlock is session-based (re-auth), NOT password-based.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { bridgeClient, type IdentityStatusResponse } from "@/api/bridge";
import { useAuth } from "@/contexts/AuthContext";

export type IdentityState = "none" | "locked" | "unlocked" | "loading";

interface IdentityContextValue {
  state: IdentityState;
  isNone: boolean;
  isLocked: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  unlockExpiresAt: string | null;
  
  // Actions
  checkStatus: () => Promise<void>;
  createIdentity: () => Promise<boolean>;
  unlock: () => Promise<boolean>;
  lock: () => Promise<boolean>;
  clearError: () => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [state, setState] = useState<IdentityState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [unlockExpiresAt, setUnlockExpiresAt] = useState<string | null>(null);

  // Sync bridge token with auth token
  useEffect(() => {
    if (isAuthenticated) {
      const token = getAccessToken();
      if (token) {
        bridgeClient.setToken(token);
      }
    }
  }, [isAuthenticated, getAccessToken]);

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setState("none");
      return;
    }

    setState("loading");
    setError(null);

    try {
      const response: IdentityStatusResponse = await bridgeClient.getIdentityStatus();
      
      if (!response.exists) {
        setState("none");
      } else {
        setState(response.state);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check identity status";
      setError(message);
      setState("none");
    }
  }, [isAuthenticated]);

  // Check identity status when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      checkStatus();
    } else {
      setState("none");
      setUnlockExpiresAt(null);
    }
  }, [isAuthenticated, checkStatus]);

  const createIdentity = useCallback(async (): Promise<boolean> => {
    setState("loading");
    setError(null);

    try {
      await bridgeClient.createIdentity();
      setState("locked");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create identity";
      setError(message);
      setState("none");
      return false;
    }
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    setState("loading");
    setError(null);

    try {
      const response = await bridgeClient.unlockIdentity();
      setState("unlocked");
      setUnlockExpiresAt(response.expiresAt);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlock identity";
      setError(message);
      setState("locked");
      return false;
    }
  }, []);

  const lock = useCallback(async (): Promise<boolean> => {
    setState("loading");
    setError(null);

    try {
      await bridgeClient.lockIdentity();
      setState("locked");
      setUnlockExpiresAt(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to lock identity";
      setError(message);
      setState("unlocked");
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <IdentityContext.Provider
      value={{
        state,
        isNone: state === "none",
        isLocked: state === "locked",
        isUnlocked: state === "unlocked",
        isLoading: state === "loading",
        error,
        unlockExpiresAt,
        checkStatus,
        createIdentity,
        unlock,
        lock,
        clearError,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }
  return context;
}
