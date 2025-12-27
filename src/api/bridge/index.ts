/**
 * Bridge API Instance (C2 Production Model)
 * 
 * Single source of truth for bridge client instantiation.
 * Uses MockBridgeClient when VITE_BRIDGE_URL is not set.
 */

import { BridgeClient, type IBridgeClient, type BridgeClientConfig } from "./client";
import { MockBridgeClient } from "./mockClient";

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";
const USE_MOCK = !BRIDGE_URL || import.meta.env.VITE_MOCK === "true";

function createBridgeClient(): IBridgeClient {
  if (USE_MOCK) {
    console.debug("[Bridge] Using mock client (demo mode)");
    return new MockBridgeClient();
  }

  const config: BridgeClientConfig = {
    baseUrl: BRIDGE_URL,
  };

  console.debug("[Bridge] Using real client:", BRIDGE_URL);
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
