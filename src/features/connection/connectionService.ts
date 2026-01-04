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

import { bridgeClient, isMockMode, getBridgeUrl } from "@/api/bridge";
import { supabase } from "@/integrations/supabase/client";
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
 * Sends connect_intent and validates connect_ack
 */
async function realConnection(
  intent: ConnectIntent,
  startTime: number
): Promise<ConnectionResult> {
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Connection timeout")), CONNECTION_TIMEOUT);
  });

  // Send connect request to bridge
  // The bridge will forward this via cMixx and return the ack
  const connectionPromise = sendConnectIntent(intent);

  // Race between connection and timeout
  const ack = await Promise.race([connectionPromise, timeoutPromise]);

  const latency = Math.round(performance.now() - startTime);

  // Validate the ACK matches our intent
  const validation = validateConnectAck(ack, intent);
  
  if (!validation.valid) {
    console.warn("[Connection] ACK validation failed", {
      requestId: intent.requestId,
      error: validation.error,
    });

    return {
      success: false,
      sessionId: intent.sessionId,
      requestId: intent.requestId,
      latency,
      errorCode: (ack.errorCode as ConnectErrorCode) || "INVALID_MESSAGE",
      errorMessage: validation.error,
    };
  }

  console.debug("[Connection] Real: Connected via cMixx", {
    requestId: intent.requestId,
    sessionId: intent.sessionId,
    latency,
  });

  return {
    success: true,
    sessionId: intent.sessionId,
    requestId: intent.requestId,
    latency,
  };
}

/**
 * Send connect_intent to Bridge and receive connect_ack
 * 
 * Note: This endpoint doesn't exist yet in the Bridge.
 * When implementing Phase D backend:
 * - Add POST /connect endpoint to Go bridge
 * - Bridge sends intent via cMixx
 * - Bridge waits for ack via cMixx
 * - Bridge returns ack to frontend
 */
async function sendConnectIntent(intent: ConnectIntent): Promise<ConnectAck> {
  // Get fresh JWT for authorization
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Bridge expects { targetUrl: "..." } payload
  const response = await fetch(`${getBridgeUrl()}/connect`, {
    method: "POST",
    headers,
    body: JSON.stringify({ targetUrl: intent.targetUrl }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Check if we're using real cMixx routing
 */
export function isLiveMode(): boolean {
  return !isMockMode();
}
