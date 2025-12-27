/**
 * Bridge API Instance
 * 
 * Single source of truth for bridge client instantiation.
 * Uses MockBridgeClient when VITE_BRIDGE_URL is not set.
 */

import { BridgeClient, type IBridgeClient } from "./client";
import { MockBridgeClient } from "./mockClient";

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";
const USE_MOCK = !BRIDGE_URL || import.meta.env.VITE_MOCK === "true";

export const bridgeClient: IBridgeClient = USE_MOCK
  ? new MockBridgeClient()
  : new BridgeClient(BRIDGE_URL);

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
} from "./client";
