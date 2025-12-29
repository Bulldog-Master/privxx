import { useQuery } from '@tanstack/react-query';
import { bridgeClient } from '@/api/bridge';

export interface BridgeHealthStatus {
  health: boolean | null;
  xxdkInfo: boolean | null;
  cmixxStatus: boolean | null;
  isLoading: boolean;
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

  return {
    health: healthQuery.isError ? false : healthQuery.data?.ok ?? null,
    xxdkInfo: xxdkQuery.isError ? false : xxdkQuery.data ? true : null,
    cmixxStatus: cmixxQuery.isError ? false : cmixxQuery.data ? true : null,
    isLoading: healthQuery.isLoading || xxdkQuery.isLoading || cmixxQuery.isLoading,
  };
}
