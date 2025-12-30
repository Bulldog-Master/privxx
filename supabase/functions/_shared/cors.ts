/**
 * Privxx CORS Headers (Edge Functions)
 * 
 * Restricted CORS for production security.
 * Only allows requests from canonical origin and Lovable preview domains.
 */

// Canonical production origin
const CANONICAL_ORIGIN = 'https://privxx.app';

// Allowed origins pattern
const ALLOWED_ORIGIN_PATTERNS = [
  'https://privxx.app',
  'https://www.privxx.app',
  // Lovable preview domains
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
];

/**
 * Check if an origin is allowed
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => {
    if (typeof pattern === 'string') {
      return origin === pattern;
    }
    return pattern.test(origin);
  });
}

/**
 * Get CORS headers for a request
 * Returns origin-specific headers for allowed origins, or rejects with empty headers
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  // SECURITY: Always validate origin against allowlist - no development bypass
  // This prevents accidental CORS bypass if ENVIRONMENT is misconfigured
  
  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    };
  }
  
  // Default: return canonical origin (will fail CORS for unauthorized origins)
  return {
    'Access-Control-Allow-Origin': CANONICAL_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightResponse(requestOrigin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(requestOrigin),
  });
}

/**
 * Legacy permissive headers (for backward compatibility during migration)
 * TODO: Remove after verifying production works with strict CORS
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
