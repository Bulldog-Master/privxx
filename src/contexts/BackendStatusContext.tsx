/**
 * BackendStatusContext - SINGLETON provider for backend status polling
 * 
 * CRITICAL: This context ensures only ONE polling interval exists app-wide.
 * All components should use useBackendStatusContext() instead of useBackendStatus()
 * to prevent duplicate /status calls and rate-limiting issues.
 */

import { createContext, useContext, ReactNode } from "react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import type { BackendStatus } from "@/hooks/useBackendStatus";

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
}

const BackendStatusContext = createContext<BackendStatusContextValue | null>(null);

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const backendStatus = useBackendStatus();
  
  return (
    <BackendStatusContext.Provider value={backendStatus}>
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
