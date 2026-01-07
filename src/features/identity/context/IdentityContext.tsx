/**
 * Identity Context (C2 Production Model)
 * 
 * Manages XX Network unlock state via Bridge API.
 * Uses GET /unlock/status and POST /unlock endpoints.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { bridgeClient, type UnlockStatusResponse } from "@/api/bridge";
import { useAuth } from "@/contexts/AuthContext";

export type IdentityState = "locked" | "unlocked" | "loading" | "offline";

interface IdentityContextValue {
  state: IdentityState;
  isLocked: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  isOffline: boolean;
  /** True after the first status check completes (prevents UI flashing during init) */
  isInitialized: boolean;
  error: string | null;
  unlockExpiresAt: string | null;
  
  // Actions
  checkStatus: () => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  clearError: () => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<IdentityState>("locked");
  const [error, setError] = useState<string | null>(null);
  const [unlockExpiresAt, setUnlockExpiresAt] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track in-flight requests to prevent duplicate calls
  const checkingRef = useRef(false);

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setState("locked");
      setIsInitialized(true);
      return;
    }

    // Prevent duplicate calls
    if (checkingRef.current) return;
    checkingRef.current = true;

    // Only show loading on first check, not on subsequent polls
    if (!isInitialized) {
      setState("loading");
    }
    setError(null);

    try {
      const response: UnlockStatusResponse = await bridgeClient.getUnlockStatus();
      
      if (response.locked) {
        setState("locked");
        setUnlockExpiresAt(null);
      } else {
        setState("unlocked");
        setUnlockExpiresAt(response.expiresAt || null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check unlock status";
      setError(message);
      const isNetworkError = message.toLowerCase().includes("network") ||
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("unreachable") ||
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("connection");
      setState(isNetworkError ? "offline" : "locked");
    } finally {
      checkingRef.current = false;
      setIsInitialized(true);
    }
  }, [isAuthenticated, isInitialized]);

  // Check status when authentication changes (but wait for auth to finish loading)
  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize
    
    if (isAuthenticated) {
      checkStatus();
    } else {
      setState("locked");
      setUnlockExpiresAt(null);
      setIsInitialized(true);
    }
  }, [isAuthenticated, authLoading, checkStatus]);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    setState("loading");
    setError(null);

    try {
      const response = await bridgeClient.unlock(password);
      if (response.success) {
        setState("unlocked");
        setUnlockExpiresAt(response.expiresAt || null);
        return true;
      } else {
        setError("Unlock failed");
        setState("locked");
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlock";
      setError(message);
      setState("locked");
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <IdentityContext.Provider
      value={{
        state,
        isLocked: state === "locked",
        isUnlocked: state === "unlocked",
        isLoading: state === "loading",
        isOffline: state === "offline",
        isInitialized,
        error,
        unlockExpiresAt,
        checkStatus,
        unlock,
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
