/**
 * Bridge API Instance (C2 Production Model)
 * 
 * Single source of truth for bridge client instantiation.
 * Uses MockBridgeClient when VITE_BRIDGE_URL is not set.
 * 
 * ARCHITECTURE:
 * - Frontend talks ONLY to the Bridge API (public)
 * - Bridge talks ONLY to local backend daemon (private localhost)
 * - Backend is the ONLY real xxdk client (holds keys/state)
 * - No direct browser access to backend
 * 
 * AUTHENTICATION:
 * - Automatically attaches Supabase session JWT to all requests
 * - Bridge verifies JWT via Supabase /auth/v1/user endpoint
 * 
 * VPS PUBLIC BRIDGE: https://bridge.privxx.app
 * LOCAL DEV BRIDGE: http://127.0.0.1:8090
 */

import { BridgeClient, type IBridgeClient, type BridgeClientConfig } from "./client";
import { MockBridgeClient } from "./mockClient";
import { supabase } from "@/integrations/supabase/client";

// Use mock mode by default for demo/preview phase
// VPS bridge requires real infrastructure with TLS configured
// Set VITE_MOCK=false and VITE_BRIDGE_URL to use real bridge
const USE_MOCK = import.meta.env.VITE_MOCK !== "false";

// VPS production proxy URL (public, frontend-accessible via HTTPS)
// TLS termination handled by reverse proxy (nginx/caddy with Let's Encrypt)
const VPS_PROXY_URL = "https://bridge.privxx.app";

// Determine effective bridge URL
function getEffectiveBridgeUrl(): string {
  // Environment variable takes priority
  if (import.meta.env.VITE_BRIDGE_URL) {
    return import.meta.env.VITE_BRIDGE_URL;
  }
  
  // Default to VPS Proxy (public entry point)
  return VPS_PROXY_URL;
}

/**
 * Get a FRESH Supabase session access token on every call.
 * NEVER cache or reuse - always fetch via getSession().
 * Relies on Supabase's built-in auto-refresh using refresh tokens.
 */
async function getSupabaseAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function createBridgeClient(): IBridgeClient {
  if (USE_MOCK) {
    console.debug("[Bridge] Using mock client (preview mode)");
    return new MockBridgeClient();
  }

  const effectiveUrl = getEffectiveBridgeUrl();
  const config: BridgeClientConfig = {
    baseUrl: effectiveUrl,
    getAccessToken: getSupabaseAccessToken,
  };

  console.debug("[Bridge] Using real client with auto-JWT:", effectiveUrl);
  return new BridgeClient(config);
}

export const bridgeClient: IBridgeClient = createBridgeClient();

export function isMockMode(): boolean {
  return USE_MOCK;
}

export function getBridgeUrl(): string {
  return getEffectiveBridgeUrl();
}

// Re-export types for convenience
export type {
  StatusResponse,
  SessionResponse,
  IdentityStatusResponse,
  IdentityCreateResponse,
  IdentityUnlockResponse,
  IdentityLockResponse,
  Message,
  MessageSendResponse,
  IBridgeClient,
  BridgeClientConfig,
  HealthResponse,
  XxdkInfoResponse,
  CmixxStatusResponse,
} from "./types";
