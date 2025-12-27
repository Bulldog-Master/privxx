/**
 * Bridge API Instance (C2 Production Model)
 * 
 * Single source of truth for bridge client instantiation.
 * Uses MockBridgeClient when VITE_BRIDGE_URL is not set.
 * 
 * CANONICAL ORIGIN: https://privxx.app
 */

import { BridgeClient, type IBridgeClient, type BridgeClientConfig } from "./client";
import { MockBridgeClient } from "./mockClient";

// Canonical production bridge URL
const CANONICAL_BRIDGE_URL = "https://privxx.app/api/bridge";

// Environment override or canonical default
const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";

// Use mock when explicitly set or no bridge URL configured
const USE_MOCK = import.meta.env.VITE_MOCK === "true" || !BRIDGE_URL;

// Determine effective bridge URL
function getEffectiveBridgeUrl(): string {
  if (BRIDGE_URL) return BRIDGE_URL;
  
  // In production, use canonical URL
  if (typeof window !== 'undefined' && 
      (window.location.origin === 'https://privxx.app' || 
       window.location.origin === 'https://www.privxx.app')) {
    return CANONICAL_BRIDGE_URL;
  }
  
  return "";
}

function createBridgeClient(): IBridgeClient {
  const effectiveUrl = getEffectiveBridgeUrl();
  
  if (USE_MOCK || !effectiveUrl) {
    console.debug("[Bridge] Using mock client (demo mode)");
    return new MockBridgeClient();
  }

  const config: BridgeClientConfig = {
    baseUrl: effectiveUrl,
  };

  console.debug("[Bridge] Using real client:", effectiveUrl);
  return new BridgeClient(config);
}

export const bridgeClient: IBridgeClient = createBridgeClient();

export function isMockMode(): boolean {
  return USE_MOCK;
}

export function getBridgeUrl(): string {
  return BRIDGE_URL;
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
} from "./types";
