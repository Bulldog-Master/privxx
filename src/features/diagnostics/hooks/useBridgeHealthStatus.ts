import { useQuery } from '@tanstack/react-query';
import { bridgeClient } from '@/api/bridge';
import type { HealthResponse, XxdkInfoResponse, CmixxStatusResponse } from '@/api/bridge/types';

export interface BridgeHealthStatus {
  // Legacy boolean fields for backwards compatibility
  health: boolean | null;
  xxdkInfo: boolean | null;
  cmixxStatus: boolean | null;
  isLoading: boolean;
  
  // Detailed response data
  healthData: HealthResponse | null;
  xxdkData: XxdkInfoResponse | null;
  cmixxData: CmixxStatusResponse | null;
  
  // Error states
  healthError: boolean;
  xxdkError: boolean;
  cmixxError: boolean;
  
  // Refetch functions
  refetchHealth: () => void;
  refetchXxdk: () => void;
  refetchCmixx: () => void;
  refetchAll: () => void;
}

export function useBridgeHealthStatus(): BridgeHealthStatus {
  const healthQuery = useQuery({
    queryKey: ['bridge-health'],
    queryFn: () => bridgeClient.health(),
    staleTime: 30000,
    retry: 1,
    refetchInterval: 60000,
  });

  const xxdkQuery = useQuery({
    queryKey: ['bridge-xxdk-info'],
    queryFn: () => bridgeClient.xxdkInfo(),
    staleTime: 30000,
    retry: 1,
    refetchInterval: 60000,
  });

  const cmixxQuery = useQuery({
    queryKey: ['bridge-cmixx-status'],
    queryFn: () => bridgeClient.cmixxStatus(),
    staleTime: 30000,
    retry: 1,
    refetchInterval: 60000,
  });

  const refetchAll = () => {
    healthQuery.refetch();
    xxdkQuery.refetch();
    cmixxQuery.refetch();
  };

  return {
    // Legacy boolean fields
    health: healthQuery.isError ? false : healthQuery.data?.ok ?? null,
    xxdkInfo: xxdkQuery.isError ? false : xxdkQuery.data ? true : null,
    cmixxStatus: cmixxQuery.isError ? false : cmixxQuery.data ? true : null,
    isLoading: healthQuery.isLoading || xxdkQuery.isLoading || cmixxQuery.isLoading,
    
    // Detailed response data
    healthData: healthQuery.data ?? null,
    xxdkData: xxdkQuery.data ?? null,
    cmixxData: cmixxQuery.data ?? null,
    
    // Error states
    healthError: healthQuery.isError,
    xxdkError: xxdkQuery.isError,
    cmixxError: cmixxQuery.isError,
    
    // Refetch functions
    refetchHealth: () => healthQuery.refetch(),
    refetchXxdk: () => xxdkQuery.refetch(),
    refetchCmixx: () => cmixxQuery.refetch(),
    refetchAll,
  };
}
