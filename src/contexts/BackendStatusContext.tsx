/**
 * BackendStatusContext - SINGLETON provider for backend status polling
 * 
 * CRITICAL: This context ensures only ONE polling interval exists app-wide.
 * All components should use useBackendStatusContext() instead of useBackendStatus()
 * to prevent duplicate /status calls and rate-limiting issues.
 * 
 * AUTH-AWARE: Only polls when user is authenticated to avoid 401 errors.
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import type { BackendStatus, AutoRetryState } from "@/hooks/useBackendStatus";
import { useAuth } from "@/contexts/AuthContext";

interface AutoRetryActions extends AutoRetryState {
  retryNow: () => void;
  cancel: () => void;
}

interface BackendStatusContextValue {
  status: BackendStatus;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  rateLimit: {
    isRateLimited: boolean;
    remainingSec: number;
    retryUntil: number;
    startCountdown: (retryUntil: number) => void;
    clearCountdown: () => void;
    formattedTime: string;
  };
  /** Auto-retry state for network errors */
  autoRetry: AutoRetryActions;
  /** Whether the user is authenticated (required for /status) */
  isAuthenticated: boolean;
}

const BackendStatusContext = createContext<BackendStatusContextValue | null>(null);

// Default status when not authenticated
const unauthenticatedStatus: BackendStatus = {
  state: "idle",
  isMock: false,
  health: "checking",
  latencyMs: null,
  lastErrorCode: null,
  failureCount: 0,
  lastSuccessAt: null,
  lastCheckAt: null,
};

const defaultRateLimit = {
  isRateLimited: false,
  remainingSec: 0,
  retryUntil: 0,
  startCountdown: () => {},
  clearCountdown: () => {},
  formattedTime: "",
};

const defaultAutoRetry: AutoRetryActions = {
  isWaiting: false,
  remainingSec: 0,
  formattedTime: "0:00",
  attempt: 0,
  maxRetries: 5,
  isExhausted: false,
  retryNow: () => {},
  cancel: () => {},
};

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Only poll when authenticated - this prevents 401 errors on startup
  const backendStatus = useBackendStatus(isAuthenticated ? 30000 : 0);
  
  // If not authenticated yet, provide a stable "checking" state
  const value = useMemo<BackendStatusContextValue>(() => {
    if (authLoading || !isAuthenticated) {
      return {
        status: unauthenticatedStatus,
        error: null,
        isLoading: authLoading,
        refetch: async () => {},
        rateLimit: defaultRateLimit,
        autoRetry: defaultAutoRetry,
        isAuthenticated: false,
      };
    }
    
    return {
      ...backendStatus,
      autoRetry: backendStatus.autoRetry,
      isAuthenticated: true,
    };
  }, [authLoading, isAuthenticated, backendStatus]);
  
  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
}

/**
 * Use this hook instead of useBackendStatus() in components.
 * Ensures all components share the same polling instance.
 */
export function useBackendStatusContext(): BackendStatusContextValue {
  const context = useContext(BackendStatusContext);
  if (!context) {
    throw new Error("useBackendStatusContext must be used within BackendStatusProvider");
  }
  return context;
}

/**
 * Optional version that returns null if outside provider (for edge cases)
 */
export function useBackendStatusOptional(): BackendStatusContextValue | null {
  return useContext(BackendStatusContext);
}
