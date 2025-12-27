/**
 * Bridge API Instance
 * 
 * Single source of truth for bridge client instantiation.
 * Uses MockBridgeClient when VITE_BRIDGE_URL is not set.
 */

import { BridgeClient, type IBridgeClient, type BridgeClientConfig } from "./client";
import { MockBridgeClient } from "./mockClient";

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";
const BRIDGE_AUTH_SECRET = import.meta.env.VITE_BRIDGE_AUTH_SECRET || "";
const USE_MOCK = !BRIDGE_URL || import.meta.env.VITE_MOCK === "true";

function createBridgeClient(): IBridgeClient {
  if (USE_MOCK) {
    return new MockBridgeClient();
  }

  const config: BridgeClientConfig = {
    baseUrl: BRIDGE_URL,
  };

  if (BRIDGE_AUTH_SECRET) {
    config.authSecret = BRIDGE_AUTH_SECRET;
  }

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
  Message,
  UnlockResponse,
  LockResponse,
  SendResponse,
  SessionRefreshResponse,
  IBridgeClient,
  BridgeClientConfig,
} from "./client";
