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

  const statusQuery = useQuery({
    queryKey: ['bridge-status'],
    queryFn: () => bridgeClient.status(),
    staleTime: 30000,
    retry: shouldRetry,
    refetchInterval: (q) => {
      const err = q.state.error;
      return err instanceof BridgeError && err.code === 'RATE_LIMITED' ? false : POLL_MS;
    },
  });

  const refetchAll = () => {
    healthQuery.refetch();
    statusQuery.refetch();
  };

  return {
    // Legacy boolean fields
    health: healthQuery.isError ? false : healthQuery.data?.ok ?? null,
    status: statusQuery.isError ? false : statusQuery.data ? true : null,
    isLoading: healthQuery.isLoading || statusQuery.isLoading,
    
    // Detailed response data
    healthData: healthQuery.data ?? null,
    statusData: statusQuery.data ?? null,
    
    // Error states
    healthError: healthQuery.isError,
    statusError: statusQuery.isError,
    
    // Refetch functions
    refetchHealth: () => healthQuery.refetch(),
    refetchStatus: () => statusQuery.refetch(),
    refetchAll,
  };
}
