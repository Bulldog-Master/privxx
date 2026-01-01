/**
 * Device Fingerprinting Utility
 * 
 * Creates a stable device fingerprint hash for detecting new device logins.
 * Privacy-first: fingerprint is stored locally and used only for user notification.
 */

import { collectBrowserAnomalySignals } from './browserAnomalySignals';

const KNOWN_DEVICES_KEY = 'privxx_known_devices';
const CURRENT_DEVICE_KEY = 'privxx_current_device';

/**
 * Generates a simple hash from a string.
 * Uses djb2 algorithm for fast, deterministic hashing.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generates a device fingerprint based on browser/device characteristics.
 * Returns a stable hash that identifies this device.
 */
export function generateDeviceFingerprint(): string {
  const signals = collectBrowserAnomalySignals();
  
  // Create a fingerprint string from stable characteristics
  const fingerprintParts = [
    signals.userAgent,
    signals.platform || '',
    signals.timezone || '',
    signals.screen?.width?.toString() || '',
    signals.screen?.height?.toString() || '',
    signals.screen?.colorDepth?.toString() || '',
    signals.webgl?.renderer || '',
    signals.hardwareConcurrency?.toString() || '',
    signals.languages?.join(',') || '',
  ];
  
  const fingerprintString = fingerprintParts.join('|');
  return simpleHash(fingerprintString);
}

/**
 * Gets a human-readable device name based on browser signals.
 */
export function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  // Detect platform
  let platform = 'Unknown Device';
  if (/iPhone/.test(ua)) platform = 'iPhone';
  else if (/iPad/.test(ua)) platform = 'iPad';
  else if (/Android/.test(ua)) platform = 'Android Device';
  else if (/Mac/.test(ua)) platform = 'Mac';
  else if (/Windows/.test(ua)) platform = 'Windows PC';
  else if (/Linux/.test(ua)) platform = 'Linux';
  
  // Detect browser
  let browser = '';
  if (/Chrome/.test(ua) && !/Chromium|Edge/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edge/.test(ua)) browser = 'Edge';
  
  return browser ? `${platform} (${browser})` : platform;
}

export interface KnownDevice {
  fingerprint: string;
  name: string;
  customName?: string;
  firstSeen: string;
  lastSeen: string;
  trusted?: boolean;
}

/**
 * Gets the list of known devices for this user.
 */
export function getKnownDevices(): KnownDevice[] {
  try {
    const stored = localStorage.getItem(KNOWN_DEVICES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the list of known devices.
 */
export function saveKnownDevices(devices: KnownDevice[]): void {
  try {
    localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Gets the current device fingerprint (cached).
 */
export function getCurrentDeviceFingerprint(): string {
  try {
    let fingerprint = localStorage.getItem(CURRENT_DEVICE_KEY);
    if (!fingerprint) {
      fingerprint = generateDeviceFingerprint();
      localStorage.setItem(CURRENT_DEVICE_KEY, fingerprint);
    }
    return fingerprint;
  } catch {
    return generateDeviceFingerprint();
  }
}

/**
 * Checks if this is a new device and registers it if so.
 * Returns true if this is a new device.
 */
export function checkAndRegisterDevice(): { isNew: boolean; device: KnownDevice } {
  const fingerprint = getCurrentDeviceFingerprint();
  const name = getDeviceName();
  const now = new Date().toISOString();
  
  const devices = getKnownDevices();
  const existingIndex = devices.findIndex(d => d.fingerprint === fingerprint);
  
  if (existingIndex === -1) {
    // New device
    const newDevice: KnownDevice = {
      fingerprint,
      name,
      firstSeen: now,
      lastSeen: now,
    };
    devices.push(newDevice);
    saveKnownDevices(devices);
    return { isNew: true, device: newDevice };
  } else {
    // Known device - update last seen
    devices[existingIndex].lastSeen = now;
    saveKnownDevices(devices);
    return { isNew: false, device: devices[existingIndex] };
  }
}

/**
 * Clears all known devices (for logout or reset).
 */
export function clearKnownDevices(): void {
  try {
    localStorage.removeItem(KNOWN_DEVICES_KEY);
    localStorage.removeItem(CURRENT_DEVICE_KEY);
  } catch {
    // Ignore storage errors
  }
}
