/**
 * Privxx Origin Configuration (LOCKED)
 * 
 * Single source of truth for canonical origin.
 * All CORS, redirects, and bridge URLs derive from this.
 * 
 * PRODUCTION: https://privxx.app
 * DEVELOPMENT: Uses current origin for local testing
 */

// Canonical production origin
export const CANONICAL_ORIGIN = 'https://privxx.app';

// Allowed origins for CORS (production + Lovable preview)
export const ALLOWED_ORIGINS = [
  'https://privxx.app',
  'https://www.privxx.app',
  // Lovable preview domains (for development)
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
];

// Bridge API URL (derived from canonical origin in production)
export const BRIDGE_BASE_URL = import.meta.env.VITE_BRIDGE_URL || `${CANONICAL_ORIGIN}/api/bridge`;

/**
 * Check if an origin is allowed for CORS
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Development mode: allow all origins
  if (import.meta.env.DEV) return true;
  
  return ALLOWED_ORIGINS.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    return allowed.test(origin);
  });
}

/**
 * Get the appropriate origin for the current environment
 */
export function getCurrentOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return CANONICAL_ORIGIN;
}

/**
 * Check if running in production (canonical origin)
 */
export function isProduction(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.origin === CANONICAL_ORIGIN ||
           window.location.origin === 'https://www.privxx.app';
  }
  return false;
}
