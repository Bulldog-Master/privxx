/**
 * Browser Anomaly Signal Collection (Phase-2 Diagnostic Stub)
 * 
 * Collects browser fingerprint signals for anomaly detection.
 * IMPORTANT: These signals are for diagnostic display only.
 * No signals are sent to any backend or stored persistently.
 */

export interface BrowserAnomalySignals {
  userAgent: string;
  platform?: string;
  languages?: readonly string[];
  hardwareConcurrency?: number;
  deviceMemory?: number;
  timezone?: string;
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
  };
  webgl?: {
    vendor?: string;
    renderer?: string;
  };
  touchSupport?: boolean;
  cookiesEnabled?: boolean;
}

/**
 * Collects browser signals that could indicate anomalies.
 * This is a diagnostic-only function - no data leaves the browser.
 */
export function collectBrowserAnomalySignals(): BrowserAnomalySignals {
  const signals: BrowserAnomalySignals = {
    userAgent: navigator.userAgent,
    platform: (navigator as any).platform,
    languages: navigator.languages,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cookiesEnabled: navigator.cookieEnabled,
  };

  // Screen info
  if (typeof window !== 'undefined' && window.screen) {
    signals.screen = {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    };
  }

  // WebGL info (optional, may not be available)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        signals.webgl = {
          vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
          renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        };
      }
    }
  } catch {
    // WebGL not available or blocked
  }

  return signals;
}

/**
 * Detects potential anomalies in browser signals.
 * Returns a list of warning strings if anomalies are detected.
 * 
 * NOTE: This is Phase-2 scaffolding only. No action is taken on anomalies.
 */
export function detectAnomalies(signals: BrowserAnomalySignals): string[] {
  const anomalies: string[] = [];

  // Check for headless browser indicators
  if (signals.userAgent.includes('HeadlessChrome')) {
    anomalies.push('Headless browser detected');
  }

  // Check for automation tools
  if ((window as any).navigator.webdriver) {
    anomalies.push('WebDriver detected');
  }

  // Check for unusual hardware concurrency
  if (signals.hardwareConcurrency && signals.hardwareConcurrency < 2) {
    anomalies.push('Low hardware concurrency');
  }

  // Check for missing WebGL (may indicate privacy mode or VM)
  if (!signals.webgl?.renderer) {
    anomalies.push('WebGL info unavailable');
  }

  return anomalies;
}
