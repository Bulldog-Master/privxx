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
  /** True for a brief period after unlock to allow UI to show stable skeleton */
  isSettling: boolean;
  error: string | null;
  unlockExpiresAt: string | null;
  
  // Actions
  checkStatus: () => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<boolean>;
  clearError: () => void;
  /** Force immediate transition to locked state (used for 403 session_locked) */
  forceSetLocked: () => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

const SETTLE_MS = 1500; // Time after unlock to show stable skeleton

export function IdentityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<IdentityState>("locked");
  const [error, setError] = useState<string | null>(null);
  const [unlockExpiresAt, setUnlockExpiresAt] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  
  // Track in-flight requests to prevent duplicate calls
  const checkingRef = useRef(false);
  // Track manual unlock/lock mutations so background status checks can't fight UI state
  const mutatingRef = useRef(false);
  // Track settle timer
  const settleTimerRef = useRef<number | null>(null);

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setState("locked");
      setIsInitialized(true);
      return;
    }

    // If we are in the middle of an unlock/lock request, don't run a competing status check.
    if (mutatingRef.current) return;

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

      // CRITICAL: Drive state from response.unlocked FIRST
      if (!response.unlocked) {
        // Locked — zero-date expiresAt is expected for locked state
        setState("locked");
        setUnlockExpiresAt(null);
        return;
      }

      // Unlocked — handle expiresAt
      const expiresAt = response.expiresAt || null;
      const isZeroDate = expiresAt === "0001-01-01T00:00:00Z";
      
      if (!expiresAt || isZeroDate) {
        // Unlocked with unknown TTL
        setState("unlocked");
        setUnlockExpiresAt(null);
        return;
      }

      const isExpired = new Date(expiresAt).getTime() <= Date.now();
      if (isExpired) {
        setState("locked");
        setUnlockExpiresAt(null);
      } else {
        setState("unlocked");
        setUnlockExpiresAt(expiresAt);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check unlock status";
      setError(message);
      // Clear TTL on errors so we don't surface stale expiry UI after login.
      setUnlockExpiresAt(null);
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
    mutatingRef.current = true;
    setState("loading");
    setError(null);
    
    // Clear any existing settle timer
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    try {
      const response = await bridgeClient.unlock(password);
      if (!response.success) {
        setError("Unlock failed");
        setState("locked");
        setUnlockExpiresAt(null);
        return false;
      }

      // Bridge unlock responses may omit TTL; always re-check authoritative status.
      const status: UnlockStatusResponse = await bridgeClient.getUnlockStatus();

      if (!status.unlocked) {
        setState("locked");
        setUnlockExpiresAt(null);
        return false;
      }

      // TTL may be omitted by the bridge in some modes.
      // expiresAt may be missing OR may be the "zero date" "0001-01-01T00:00:00Z" when locked.
      const expiresAt = status.expiresAt || null;
      const isZeroDate = expiresAt === "0001-01-01T00:00:00Z";
      
      if (!expiresAt || isZeroDate) {
        setState("unlocked");
        setUnlockExpiresAt(null);
        // Start settling period to prevent UI flash
        setIsSettling(true);
        settleTimerRef.current = window.setTimeout(() => {
          setIsSettling(false);
          settleTimerRef.current = null;
        }, SETTLE_MS);
        return true;
      }

      const isExpired = new Date(expiresAt).getTime() <= Date.now();
      if (isExpired) {
        setState("locked");
        setUnlockExpiresAt(null);
        setError("Unlock expired");
        return false;
      }

      setState("unlocked");
      setUnlockExpiresAt(expiresAt);
      // Start settling period to prevent UI flash
      setIsSettling(true);
      settleTimerRef.current = window.setTimeout(() => {
        setIsSettling(false);
        settleTimerRef.current = null;
      }, SETTLE_MS);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlock";
      setError(message);
      setState("locked");
      setUnlockExpiresAt(null);
      return false;
    } finally {
      mutatingRef.current = false;
    }
  }, []);

  const lock = useCallback(async (): Promise<boolean> => {
    mutatingRef.current = true;
    setState("loading");
    setError(null);

    try {
      const response = await bridgeClient.lock();
      if (response.success) {
        setState("locked");
        setUnlockExpiresAt(null);
        return true;
      } else {
        setError("Lock failed");
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to lock";
      setError(message);
      return false;
    } finally {
      mutatingRef.current = false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Force immediate transition to locked state (used for 403 session_locked)
  const forceSetLocked = useCallback(() => {
    setState("locked");
    setUnlockExpiresAt(null);
    setError(null);
  }, []);

  return (
    <IdentityContext.Provider
      value={{
        state,
        isLocked: state === "locked",
        isUnlocked: state === "unlocked",
        isLoading: state === "loading",
        isOffline: state === "offline",
        isInitialized,
        isSettling,
        error,
        unlockExpiresAt,
        checkStatus,
        unlock,
        lock,
        clearError,
        forceSetLocked,
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
