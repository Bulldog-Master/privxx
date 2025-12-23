import { useState, useEffect, useCallback } from 'react';
import { getCmixxStatus, getXxdkClient, CmixxStatusResponse, XxdkClientResponse, isApiError } from '@/lib/privxx-api';

export interface BackendStatus {
  connected: boolean;
  ready: boolean;
  phase: string;
  uptimeSec: number;
  inboxCount: number;
  mode: 'real' | 'simulated' | 'offline';
  lastChecked: number;
  error: string | null;
}

export interface Identity {
  transmissionId: string;
  receptionId: string;
  loaded: boolean;
  error: string | null;
}

interface UseBackendStatusReturn {
  status: BackendStatus;
  identity: Identity;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

const POLL_INTERVAL = 30000; // 30 seconds

export function useBackendStatus(): UseBackendStatusReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<BackendStatus>({
    connected: false,
    ready: false,
    phase: 'unknown',
    uptimeSec: 0,
    inboxCount: 0,
    mode: 'offline',
    lastChecked: 0,
    error: null,
  });
  const [identity, setIdentity] = useState<Identity>({
    transmissionId: '',
    receptionId: '',
    loaded: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch status
    const statusResult = await getCmixxStatus();
    
    if (isApiError(statusResult)) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        mode: 'offline',
        error: statusResult.error,
        lastChecked: Date.now(),
      }));
    } else {
      setStatus({
        connected: true,
        ready: statusResult.ready,
        phase: statusResult.phase,
        uptimeSec: statusResult.uptimeSec,
        inboxCount: statusResult.inboxCount,
        mode: statusResult.mode,
        lastChecked: Date.now(),
        error: null,
      });
    }

    // Fetch identity
    const clientResult = await getXxdkClient();
    
    if (isApiError(clientResult)) {
      setIdentity(prev => ({
        ...prev,
        loaded: false,
        error: clientResult.error,
      }));
    } else {
      setIdentity({
        transmissionId: clientResult.transmissionId,
        receptionId: clientResult.receptionId,
        loaded: true,
        error: null,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, identity, refresh, isLoading };
}
