/**
 * Connection Service
 * 
 * Handles connection flow using either:
 * 1. Real cMixx routing via Bridge API (Phase D+)
 * 2. Simulated routing for demo mode
 * 
 * The service abstracts the transport layer so ConnectionCard
 * doesn't need to know if it's demo or live.
 */

import { bridgeClient, isMockMode } from "@/api/bridge";
import type { 
  ConnectIntent, 
  ConnectAck, 
  ConnectionResult,
  ConnectErrorCode 
} from "./types";
import { createConnectIntent, validateConnectAck, SCHEMA_VERSION } from "./types";

// Connection timeout (ms)
const CONNECTION_TIMEOUT = 30000;

/**
 * Attempt to connect through Privxx
 * 
 * In demo mode: Simulates the connection with realistic timing
 * In live mode: Sends connect_intent via Bridge and waits for connect_ack
 */
export async function connect(targetUrl: string): Promise<ConnectionResult> {
  const intent = createConnectIntent(targetUrl);
  const startTime = performance.now();

  console.debug("[Connection] Initiating connection", {
    mode: isMockMode() ? "demo" : "live",
    requestId: intent.requestId,
    sessionId: intent.sessionId,
    targetUrl: intent.targetUrl,
  });

  try {
    if (isMockMode()) {
      return await simulateConnection(intent, startTime);
    } else {
      return await realConnection(intent, startTime);
    }
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    console.error("[Connection] Failed", { 
      requestId: intent.requestId, 
      error,
      latency 
    });

    return {
      success: false,
      sessionId: intent.sessionId,
      requestId: intent.requestId,
      latency,
      errorCode: "NETWORK_ERROR",
      errorMessage: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Simulate connection for demo mode
 * Provides realistic timing without actual network calls
 */
async function simulateConnection(
  intent: ConnectIntent,
  startTime: number
): Promise<ConnectionResult> {
  // Simulate network delay (2-3 seconds)
  const simulatedDelay = 2000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

  // Simulate occasional failures (5% chance in demo)
  const shouldFail = Math.random() < 0.05;
  
  if (shouldFail) {
    const latency = Math.round(performance.now() - startTime);
    console.debug("[Connection] Demo: Simulated failure", { 
      requestId: intent.requestId,
      latency 
    });

    return {
      success: false,
      sessionId: intent.sessionId,
      requestId: intent.requestId,
      latency,
      errorCode: "SERVER_BUSY",
      errorMessage: "Simulated connection timeout",
    };
  }

  const latency = Math.round(performance.now() - startTime);
  
  console.debug("[Connection] Demo: Connected", { 
    requestId: intent.requestId,
    sessionId: intent.sessionId,
    latency 
  });

  return {
    success: true,
    sessionId: intent.sessionId,
    requestId: intent.requestId,
    latency,
  };
}

/**
 * Real connection via Bridge API
 * Uses bridgeClient which includes proper auth headers (Authorization + apikey)
 */
async function realConnection(
  intent: ConnectIntent,
  startTime: number
): Promise<ConnectionResult> {
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Connection timeout")), CONNECTION_TIMEOUT);
  });

  // Use bridgeClient.connect() - handles auth headers properly
  const connectionPromise = bridgeClient.connect();

  // Race between connection and timeout
  const response = await Promise.race([connectionPromise, timeoutPromise]);

  const latency = Math.round(performance.now() - startTime);

  // Check if response indicates connection is in progress or secure
  if (response.state === "connecting" || response.state === "secure") {
    console.debug("[Connection] Real: Connected via Bridge", {
      requestId: intent.requestId,
      sessionId: intent.sessionId,
      state: response.state,
      latency,
    });

    return {
      success: true,
      sessionId: intent.sessionId,
      requestId: intent.requestId,
      latency,
    };
  }

  // Unexpected state
  console.warn("[Connection] Bridge returned unexpected state", {
    requestId: intent.requestId,
    state: response.state,
  });

  return {
    success: false,
    sessionId: intent.sessionId,
    requestId: intent.requestId,
    latency,
    errorCode: "NETWORK_ERROR",
    errorMessage: response.message || "Unexpected connection state",
  };
}

/**
 * Check if we're using real cMixx routing
 */
export function isLiveMode(): boolean {
  return !isMockMode();
}
