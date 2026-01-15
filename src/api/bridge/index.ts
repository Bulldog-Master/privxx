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
 * CANONICAL URL: https://privxx.app (per API contract - the ONLY valid base URL)
 * LOCAL DEV: Override with VITE_BRIDGE_URL for local testing only
 * 
 * Environment Variables:
 * - VITE_BRIDGE_URL: Override the default bridge URL (e.g., https://bridge.privxx.app for TLS)
 * - VITE_MOCK: Set to "false" to use real bridge instead of mock
 */

import { BridgeClient, SessionLockedError, type IBridgeClient, type BridgeClientConfig } from "./client";
import { MockBridgeClient } from "./mockClient";
import { supabase } from "@/integrations/supabase/client";

// Re-export SessionLockedError for UI layer consumption
export { SessionLockedError } from "./client";

// Real bridge mode by default for production
// Set VITE_MOCK=true to enable mock mode for local development
const USE_MOCK = import.meta.env.VITE_MOCK === "true";

// Production API URL (Cloudflare handles routing)
// Per API contract: https://api.privxx.app serves JSON API
// Override with VITE_BRIDGE_URL only for local development
const DEFAULT_BRIDGE_URL = "https://api.privxx.app";

// Determine effective bridge URL
function getEffectiveBridgeUrl(): string {
  // Environment variable takes priority
  if (import.meta.env.VITE_BRIDGE_URL) {
    return import.meta.env.VITE_BRIDGE_URL;
  }
  
  // Default to VPS URL (public entry point)
  return DEFAULT_BRIDGE_URL;
}

/**
 * Get a FRESH Supabase session access token on every call.
 * NEVER cache or reuse - always fetch via getSession().
 * Relies on Supabase's built-in auto-refresh using refresh tokens.
 * 
 * IMPORTANT: If getSession returns null, we try ONE refresh attempt
 * in case the session just needs initialization.
 */
async function getSupabaseAccessToken(): Promise<string | null> {
  // First attempt: get current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    return session.access_token;
  }
  
  // If no session and no error, the session might not be initialized yet
  // This can happen on page load or after the tab is backgrounded
  if (!session && !error) {
    // Small delay to let auth state settle, then retry once
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: { session: retrySession } } = await supabase.auth.getSession();
    return retrySession?.access_token ?? null;
  }
  
  return null;
}

function createBridgeClient(): IBridgeClient {
  if (USE_MOCK) {
    console.debug("[Bridge] Using mock client (preview mode)");
    return new MockBridgeClient();
  }

  const effectiveUrl = getEffectiveBridgeUrl();
  
  // Get the Supabase anon key from environment (REQUIRED per handoff doc)
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const config: BridgeClientConfig = {
    baseUrl: effectiveUrl,
    getAccessToken: getSupabaseAccessToken,
    anonKey, // Required for all authenticated Bridge requests
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
  UnlockStatusResponse,
  UnlockResponse,
  LockResponse,
  Message,
  MessageSendResponse,
  IBridgeClient,
  BridgeClientConfig,
  HealthResponse,
  ConnectResponse,
  DisconnectResponse,
  // Phase-1 message types
  InboxResponse,
  ThreadResponse,
  MessageItem,
  IssueSessionRequest,
  IssueSessionResponse,
  SessionPurpose,
} from "./types";

// Re-export message types from dedicated file
export type { SendMessageResponse } from "./messageTypes";
