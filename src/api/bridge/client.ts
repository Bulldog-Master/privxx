/**
 * Privxx Bridge Client SDK (C2 Production Model)
 * 
 * AUTHORITATIVE — Architecture Locked
 * Frontend → Bridge → Backend (xxdk)
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Error classification (network vs server vs client)
 * - Correlation IDs for debugging
 */

import type {
  StatusResponse,
  UnlockStatusResponse,
  UnlockResponse,
  LockResponse,
  Message,
  MessageSendResponse,
  IBridgeClient,
  BridgeClientConfig,
  HealthResponse,
  DisconnectResponse,
  InboxRequest,
  InboxResponse,
  ThreadRequest,
  ThreadResponse,
  SendMessageRequest,
  ConnectAck,
} from "./types";
import type { SendMessageResponse as NewSendMessageResponse } from "./messageTypes";

// Error types for better handling
export class BridgeError extends Error {
  constructor(
    message: string,
    public readonly code: BridgeErrorCode,
    public readonly statusCode?: number,
    public readonly correlationId?: string,
    public readonly retryable: boolean = false,
    /** Seconds until retry is allowed (only meaningful for RATE_LIMITED) */
    public readonly retryAfterSec?: number
  ) {
    super(message);
    this.name = "BridgeError";
  }
}

/**
 * SessionLockedError - thrown when Bridge returns 403 with code "session_locked"
 * UI layer should catch this and redirect to Unlock screen
 */
export class SessionLockedError extends Error {
  public readonly code = "session_locked" as const;
  public readonly statusCode = 403;
  
  constructor(message: string) {
    super(message);
    this.name = "SessionLockedError";
  }
}

export type BridgeErrorCode = 
  | "NETWORK_ERROR"      // Connection failed, timeout, etc.
  | "TIMEOUT"            // Request timed out
  | "UNAUTHORIZED"       // 401 - token expired/invalid
  | "FORBIDDEN"          // 403 - access denied
  | "SESSION_LOCKED"     // 403 with code "session_locked"
  | "NOT_FOUND"          // 404 - resource not found
  | "RATE_LIMITED"       // 429 - too many requests
  | "SERVER_ERROR"       // 5xx errors
  | "CLIENT_ERROR"       // 4xx errors (other than above)
  | "PARSE_ERROR";       // Response parsing failed

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

const DEFAULT_TIMEOUT_MS = 30000;

// Methods that are safe to retry (idempotent)
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Status codes that indicate a retryable error
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class BridgeClient implements IBridgeClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;
  private timeoutMs: number;
  private getAccessToken?: () => Promise<string | null>;
  private getUserId?: () => Promise<string | null>;
  private anonKey?: string;

  constructor(config: BridgeClientConfig | string) {
    if (typeof config === "string") {
      this.baseUrl = config;
      this.retryConfig = DEFAULT_RETRY_CONFIG;
      this.timeoutMs = DEFAULT_TIMEOUT_MS;
    } else {
      this.baseUrl = config.baseUrl;
      this.retryConfig = config.retry ?? DEFAULT_RETRY_CONFIG;
      this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      this.getAccessToken = config.getAccessToken;
      this.getUserId = config.getUserId;
      this.anonKey = config.anonKey;
    }
  }

  private classifyError(status: number): { code: BridgeErrorCode; retryable: boolean } {
    if (status === 401) return { code: "UNAUTHORIZED", retryable: false };
    if (status === 403) return { code: "FORBIDDEN", retryable: false };
    if (status === 404) return { code: "NOT_FOUND", retryable: false };
    // IMPORTANT: do not auto-retry 429; it prolongs lockouts and increases load
    if (status === 429) return { code: "RATE_LIMITED", retryable: false };
    if (status >= 500) return { code: "SERVER_ERROR", retryable: true };
    return { code: "CLIENT_ERROR", retryable: false };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff with jitter
    const delay = Math.min(
      this.retryConfig.baseDelayMs * Math.pow(2, attempt),
      this.retryConfig.maxDelayMs
    );
    // Add 10-30% jitter to prevent thundering herd
    const jitter = delay * (0.1 + Math.random() * 0.2);
    return Math.round(delay + jitter);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = performance.now();
    const requestId = `web-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const method = options.method || "GET";
    const isIdempotent = IDEMPOTENT_METHODS.has(method.toUpperCase());

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
    };

    // Always fetch fresh token from getAccessToken - never use cached tokens
    const token = this.getAccessToken 
      ? await this.getAccessToken() 
      : null;
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add X-User-Id header (required by bridge for protected endpoints)
    const userId = this.getUserId
      ? await this.getUserId()
      : null;
    
    if (userId) {
      headers["X-User-Id"] = userId;
    }

    // Add apikey header (required for all authenticated requests per handoff doc)
    if (this.anonKey) {
      headers["apikey"] = this.anonKey;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    let lastError: Error | null = null;
    let attempt = 0;
    
    // Debug: Log the full URL being called
    const fullUrl = `${this.baseUrl}${path}`;
    console.log(`[Bridge Request] ${method} ${fullUrl} [${requestId}]`);

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        const res = await this.fetchWithTimeout(
          fullUrl,
          requestOptions,
          this.timeoutMs
        );

        const latency = Math.round(performance.now() - startTime);

        if (!res.ok) {
          const { code, retryable } = this.classifyError(res.status);
          
          // Parse error body
          let errorMessage: string;
          let retryAfterSec: number | undefined;
          let sessionLockedCode: string | undefined;
          try {
            const errorBody = await res.json();
            const body = errorBody as { error?: string; message?: string; retryAfter?: number; code?: string };
            errorMessage = body.message || body.error || `HTTP ${res.status}`;
            sessionLockedCode = body.code;
            if (typeof body.retryAfter === "number" && body.retryAfter > 0) {
              retryAfterSec = Math.ceil(body.retryAfter);
            }
          } catch {
            errorMessage = `HTTP ${res.status}`;
          }

          // Special handling: 403 with code "session_locked" throws SessionLockedError
          if (res.status === 403 && sessionLockedCode === "session_locked") {
            console.debug(`[Bridge] ${path} session_locked (${latency}ms) [${requestId}]`);
            throw new SessionLockedError(errorMessage);
          }

          const error = new BridgeError(
            errorMessage,
            code,
            res.status,
            requestId,
            retryable,
            retryAfterSec
          );

          // Only retry if retryable and idempotent (or explicitly POST for certain endpoints)
          const shouldRetry = retryable && 
            (isIdempotent || RETRYABLE_STATUS_CODES.has(res.status)) &&
            attempt < this.retryConfig.maxRetries;

          if (shouldRetry) {
            const backoff = this.calculateBackoff(attempt);
            console.debug(
              `[Bridge] ${path} failed (${latency}ms) [${requestId}], ` +
              `retrying in ${backoff}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries}):`,
              errorMessage
            );
            await this.sleep(backoff);
            attempt++;
            continue;
          }

          console.debug(
            `[Bridge] ${path} failed (${latency}ms) [${requestId}]:`,
            errorMessage
          );
          throw error;
        }

        console.debug(`[Bridge] ${path} ok (${latency}ms) [${requestId}]`);
        
        try {
          const text = await res.text();
          // Try to parse as JSON
          try {
            return JSON.parse(text);
          } catch {
            // Log what we actually received for debugging
            const preview = text.slice(0, 200);
            console.error(`[Bridge] ${path} response not JSON [${requestId}]:`, preview);
            throw new BridgeError(
              `Server returned non-JSON response (${text.length} bytes)`,
              "PARSE_ERROR",
              res.status,
              requestId,
              false
            );
          }
        } catch (parseErr) {
          if (parseErr instanceof BridgeError) throw parseErr;
          throw new BridgeError(
            "Failed to read response body",
            "PARSE_ERROR",
            res.status,
            requestId,
            false
          );
        }
      } catch (err) {
        const latency = Math.round(performance.now() - startTime);
        
        // Handle abort (timeout)
        if (err instanceof Error && err.name === "AbortError") {
          const timeoutError = new BridgeError(
            `Request timed out after ${this.timeoutMs}ms`,
            "TIMEOUT",
            undefined,
            requestId,
            isIdempotent
          );
          
          if (isIdempotent && attempt < this.retryConfig.maxRetries) {
            const backoff = this.calculateBackoff(attempt);
            console.debug(
              `[Bridge] ${path} timeout (${latency}ms) [${requestId}], ` +
              `retrying in ${backoff}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
            );
            await this.sleep(backoff);
            attempt++;
            lastError = timeoutError;
            continue;
          }
          
          throw timeoutError;
        }

        // Handle network errors
        if (err instanceof TypeError && err.message.includes("fetch")) {
          // Log detailed network error info for debugging
          console.error(`[Bridge Network Error] ${method} ${fullUrl}`, {
            errorName: err.name,
            errorMessage: err.message,
            requestId,
            attempt,
          });
          
          const networkError = new BridgeError(
            `Network connection failed: ${err.message}`,
            "NETWORK_ERROR",
            undefined,
            requestId,
            isIdempotent
          );
          
          if (isIdempotent && attempt < this.retryConfig.maxRetries) {
            const backoff = this.calculateBackoff(attempt);
            console.debug(
              `[Bridge] ${path} network error (${latency}ms) [${requestId}], ` +
              `retrying in ${backoff}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
            );
            await this.sleep(backoff);
            attempt++;
            lastError = networkError;
            continue;
          }
          
          throw networkError;
        }
        
        // Catch-all for other fetch failures (CORS, blocked, etc.)
        if (err instanceof Error) {
          console.error(`[Bridge Fetch Error] ${method} ${fullUrl}`, {
            errorName: err.name,
            errorMessage: err.message,
            requestId,
            attempt,
          });
          
          const networkError = new BridgeError(
            `Fetch failed: ${err.name} - ${err.message}`,
            "NETWORK_ERROR",
            undefined,
            requestId,
            isIdempotent
          );
          
          if (isIdempotent && attempt < this.retryConfig.maxRetries) {
            const backoff = this.calculateBackoff(attempt);
            await this.sleep(backoff);
            attempt++;
            lastError = networkError;
            continue;
          }
          
          throw networkError;
        }

        // Re-throw BridgeErrors
        if (err instanceof BridgeError) {
          throw err;
        }

        // Unknown error
        console.debug(`[Bridge] ${path} error (${latency}ms) [${requestId}]:`, err);
        throw err;
      }
    }

    // Should not reach here, but just in case
    throw lastError || new Error("Request failed after retries");
  }

  // Health (public, no auth required)
  async health(): Promise<HealthResponse> {
    return this.request("/health");
  }

  // Status (requires auth - returns connection state)
  async status(): Promise<StatusResponse> {
    return this.request("/status");
  }

  // Connection (requires auth)
  /**
   * Connect through the Privxx tunnel to a target URL.
   * Sends Phase-D connect_intent envelope as required by backend.
   * @param targetUrl - The destination URL to route through cMixx
   */
  async connect(targetUrl: string): Promise<ConnectAck> {
    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `cli-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const connectIntent = {
      v: 1,
      type: "connect_intent" as const,
      requestId,
      targetUrl,
    };

    return this.request("/connect", {
      method: "POST",
      body: JSON.stringify(connectIntent),
    });
  }

  async disconnect(): Promise<DisconnectResponse> {
    return this.request("/disconnect", { method: "POST" });
  }

  // Unlock (requires auth)
  async getUnlockStatus(): Promise<UnlockStatusResponse> {
    return this.request("/unlock/status");
  }

  async unlock(password: string): Promise<UnlockResponse> {
    return this.request("/unlock", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async lock(): Promise<LockResponse> {
    return this.request("/lock", { method: "POST" });
  }

  // Messages (Phase-1 contract)
  
  /** POST /session/issue - obtain sessionId for messaging operations */
  async issueSession(req: { purpose: "message_receive" | "message_send"; conversationId: string | null }): Promise<{ sessionId: string; serverTime?: string }> {
    return this.request("/session/issue", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  /** 
   * POST /message/inbox - queue view (available messages only)
   * Internally issues a session with purpose: "message_receive", conversationId: null
   */
  async fetchInbox(req?: { limit?: number }): Promise<InboxResponse> {
    // Issue session for inbox (no conversationId)
    const { sessionId } = await this.issueSession({
      purpose: "message_receive",
      conversationId: null,
    });
    
    return this.request("/message/inbox", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        limit: req?.limit,
      }),
    });
  }

  /** 
   * POST /message/thread - history view for a conversation
   * Internally issues a session with purpose: "message_receive", conversationId
   */
  async fetchThread(req: { conversationId: string; limit?: number }): Promise<ThreadResponse> {
    // Issue session for this conversation
    const { sessionId } = await this.issueSession({
      purpose: "message_receive",
      conversationId: req.conversationId,
    });
    
    return this.request("/message/thread", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        conversationId: req.conversationId,
        limit: req.limit,
      }),
    });
  }

  /**
   * POST /message/send - queue outbound message
   * Session issuance is handled internally
   * @param conversationId - MUST be provided (bridge-assigned thread ID)
   * @param plaintextB64 - Base64-encoded plaintext message
   */
  async sendMessage(req: { conversationId: string; plaintextB64: string }): Promise<NewSendMessageResponse> {
    // Issue session for sending to this conversation
    const { sessionId } = await this.issueSession({
      purpose: "message_send",
      conversationId: req.conversationId,
    });
    
    return this.request<NewSendMessageResponse>("/message/send", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        conversationId: req.conversationId,
        plaintextB64: req.plaintextB64,
      }),
    });
  }

  /**
   * POST /message/ack - mark messages as consumed (delivery bookkeeping)
   * Session issuance is handled internally
   * 
   * @param conversationId - Conversation ID (must match session scope)
   * @param envelopeFingerprints - Array of fingerprints to mark consumed
   * @returns Number of fingerprints successfully acked
   */
  async ackMessages(req: { conversationId: string; envelopeFingerprints: string[] }): Promise<{ acked: number; serverTime?: string }> {
    // Issue session for this conversation (message_receive scope)
    const { sessionId } = await this.issueSession({
      purpose: "message_receive",
      conversationId: req.conversationId,
    });
    
    return this.request("/message/ack", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        conversationId: req.conversationId,
        envelopeFingerprints: req.envelopeFingerprints,
      }),
    });
  }

  // Legacy method (deprecated)
  /** @deprecated Use fetchInbox instead */
  async getInbox(): Promise<Message[]> {
    const res = await this.request<{ messages: Message[] }>("/messages/inbox");
    return res.messages;
  }

}

// Re-export types
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
} from "./types";
