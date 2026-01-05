import React, { createContext, useContext } from "react";
import { useBackendStatus, type BackendStatus } from "@/hooks/useBackendStatus";
import { useAuth } from "@/contexts/AuthContext";
import type { useRateLimitCountdown } from "@/features/diagnostics/hooks/useRateLimitCountdown";

// NOTE: This provider intentionally centralizes /status polling to a single place.
// Multiple components previously called useBackendStatus() independently, which
// created parallel polling loops and triggered bridge rate-limits.

export interface SharedBackendStatusValue {
  status: BackendStatus;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  rateLimit: ReturnType<typeof useRateLimitCountdown>;
}

const BackendStatusContext = createContext<SharedBackendStatusValue | null>(null);

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Single poller for the whole app — gated by auth.
  const value = useBackendStatus(30000, { enabled: isAuthenticated });

  return <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>;
}

export function useBackendStatusShared(): SharedBackendStatusValue {
  const ctx = useContext(BackendStatusContext);
  if (!ctx) {
    throw new Error("useBackendStatusShared must be used within BackendStatusProvider");
  }
  return ctx;
}
