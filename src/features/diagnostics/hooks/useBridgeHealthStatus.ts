import { useQuery } from '@tanstack/react-query';
import { bridgeClient } from '@/api/bridge';
import { BridgeError } from '@/api/bridge/client';
import type { HealthResponse, StatusResponse } from '@/api/bridge/types';

export interface BridgeHealthStatus {
  // Legacy boolean fields for backwards compatibility
  health: boolean | null;
  status: boolean | null;
  isLoading: boolean;
  
  // Detailed response data
  healthData: HealthResponse | null;
  statusData: StatusResponse | null;
  
  // Error states
  healthError: boolean;
  statusError: boolean;
  
  // Refetch functions
  refetchHealth: () => void;
  refetchStatus: () => void;
  refetchAll: () => void;
}

const POLL_MS = 60000;

function shouldRetry(_failureCount: number, error: unknown) {
  // Never retry while rate-limited; it prolongs lockouts and adds load.
  if (error instanceof BridgeError && error.code === 'RATE_LIMITED') return false;
  return _failureCount < 1;
}

/**
 * IMPORTANT: This hook only calls /health (public endpoint).
 * /status is handled by useBackendStatus to avoid duplicate polling and rate-limit loops.
 */
export function useBridgeHealthStatus(): BridgeHealthStatus {
  const healthQuery = useQuery({
    queryKey: ['bridge-health'],
    queryFn: () => bridgeClient.health(),
    staleTime: 30000,
    retry: shouldRetry,
    refetchInterval: (q) => {
      const err = q.state.error;
      return err instanceof BridgeError && err.code === 'RATE_LIMITED' ? false : POLL_MS;
    },
  });

  // DO NOT call /status here - useBackendStatus handles it with proper rate-limit protection
  // This prevents duplicate polling and rate-limit cascades

  return {
    // Legacy boolean fields
    health: healthQuery.isError ? false : healthQuery.data?.ok ?? null,
    status: null, // Derived from useBackendStatus, not here
    isLoading: healthQuery.isLoading,
    
    // Detailed response data
    healthData: healthQuery.data ?? null,
    statusData: null, // Not fetched here
    
    // Error states
    healthError: healthQuery.isError,
    statusError: false,
    
    // Refetch functions
    refetchHealth: () => healthQuery.refetch(),
    refetchStatus: () => {}, // No-op - use useBackendStatus
    refetchAll: () => healthQuery.refetch(),
  };
}
