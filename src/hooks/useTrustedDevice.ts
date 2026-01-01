/**
 * Trusted Device Check Hook
 * 
 * Checks if the current device is marked as trusted for 2FA bypass.
 */

import { useMemo } from 'react';
import { getKnownDevices, getCurrentDeviceFingerprint } from '@/lib/deviceFingerprint';

export function useTrustedDevice() {
  const result = useMemo(() => {
    const fingerprint = getCurrentDeviceFingerprint();
    const devices = getKnownDevices();
    const currentDevice = devices.find(d => d.fingerprint === fingerprint);
    
    return {
      isTrusted: currentDevice?.trusted ?? false,
      deviceName: currentDevice?.name ?? 'Unknown Device',
      fingerprint,
    };
  }, []);

  return result;
}

/**
 * Check if current device is trusted (non-hook version for edge functions)
 */
export function isDeviceTrusted(): boolean {
  try {
    const fingerprint = getCurrentDeviceFingerprint();
    const devices = getKnownDevices();
    const currentDevice = devices.find(d => d.fingerprint === fingerprint);
    return currentDevice?.trusted ?? false;
  } catch {
    return false;
  }
}
