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
 * VPS PUBLIC BRIDGE: http://66.94.109.237:8090
 * LOCAL DEV BRIDGE: http://127.0.0.1:8090
 */

import { BridgeClient, type IBridgeClient, type BridgeClientConfig } from "./client";
import { MockBridgeClient } from "./mockClient";

// VPS production bridge URL (public, frontend-accessible)
const VPS_BRIDGE_URL = "http://66.94.109.237:8090";

// Local development bridge URL
const LOCAL_BRIDGE_URL = "http://127.0.0.1:8090";

// Environment override or VPS default
const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || VPS_BRIDGE_URL;

// Use mock when explicitly set
const USE_MOCK = import.meta.env.VITE_MOCK === "true";

// Determine effective bridge URL
function getEffectiveBridgeUrl(): string {
  // Environment variable takes priority
  if (import.meta.env.VITE_BRIDGE_URL) {
    return import.meta.env.VITE_BRIDGE_URL;
  }
  
  // Default to VPS bridge
  return VPS_BRIDGE_URL;
}

function createBridgeClient(): IBridgeClient {
  const effectiveUrl = getEffectiveBridgeUrl();
  
  if (USE_MOCK) {
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
