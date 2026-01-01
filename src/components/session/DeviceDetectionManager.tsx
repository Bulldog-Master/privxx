/**
 * Device Detection Manager Component
 * 
 * Runs device detection on login and triggers notifications for new devices.
 */

import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export function DeviceDetectionManager() {
  // Just mount the hook to trigger device detection
  useDeviceDetection();
  return null;
}
