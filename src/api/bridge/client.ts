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
  ConnectResponse,
  DisconnectResponse,
} from "./types";

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

export type BridgeErrorCode = 
  | "NETWORK_ERROR"      // Connection failed, timeout, etc.
  | "TIMEOUT"            // Request timed out
  | "UNAUTHORIZED"       // 401 - token expired/invalid
  | "FORBIDDEN"          // 403 - access denied
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
    const correlationId = crypto.randomUUID().slice(0, 8);
    const method = options.method || "GET";
    const isIdempotent = IDEMPOTENT_METHODS.has(method.toUpperCase());

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Correlation-Id": correlationId,
    };

    // Always fetch fresh token from getAccessToken - never use cached tokens
    const token = this.getAccessToken 
      ? await this.getAccessToken() 
      : null;
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
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

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        const res = await this.fetchWithTimeout(
          `${this.baseUrl}${path}`,
          requestOptions,
          this.timeoutMs
        );

        const latency = Math.round(performance.now() - startTime);

        if (!res.ok) {
          const { code, retryable } = this.classifyError(res.status);
          
          // Parse error body
          let errorMessage: string;
          let retryAfterSec: number | undefined;
          try {
            const errorBody = await res.json();
            const body = errorBody as { error?: string; message?: string; retryAfter?: number };
            errorMessage = body.message || body.error || `HTTP ${res.status}`;
            if (typeof body.retryAfter === "number" && body.retryAfter > 0) {
              retryAfterSec = Math.ceil(body.retryAfter);
            }
          } catch {
            errorMessage = `HTTP ${res.status}`;
          }

          const error = new BridgeError(
            errorMessage,
            code,
            res.status,
            correlationId,
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
              `[Bridge] ${path} failed (${latency}ms) [${correlationId}], ` +
              `retrying in ${backoff}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries}):`,
              errorMessage
            );
            await this.sleep(backoff);
            attempt++;
            continue;
          }

          console.debug(
            `[Bridge] ${path} failed (${latency}ms) [${correlationId}]:`,
            errorMessage
          );
          throw error;
        }

        console.debug(`[Bridge] ${path} ok (${latency}ms) [${correlationId}]`);
        
        try {
          return await res.json();
        } catch {
          throw new BridgeError(
            "Failed to parse response",
            "PARSE_ERROR",
            res.status,
            correlationId,
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
            correlationId,
            isIdempotent
          );
          
          if (isIdempotent && attempt < this.retryConfig.maxRetries) {
            const backoff = this.calculateBackoff(attempt);
            console.debug(
              `[Bridge] ${path} timeout (${latency}ms) [${correlationId}], ` +
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
          const networkError = new BridgeError(
            "Network connection failed",
            "NETWORK_ERROR",
            undefined,
            correlationId,
            isIdempotent
          );
          
          if (isIdempotent && attempt < this.retryConfig.maxRetries) {
            const backoff = this.calculateBackoff(attempt);
            console.debug(
              `[Bridge] ${path} network error (${latency}ms) [${correlationId}], ` +
              `retrying in ${backoff}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
            );
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
        console.debug(`[Bridge] ${path} error (${latency}ms) [${correlationId}]:`, err);
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
   * Connect to the bridge backend.
   * targetUrl is always http://127.0.0.1:8090 (local to VPS behind Cloudflare)
   */
  async connect(): Promise<ConnectResponse> {
    return this.request("/connect", {
      method: "POST",
      body: JSON.stringify({ targetUrl: "http://127.0.0.1:8090" }),
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

  // Messages (future - kept for interface compatibility)
  async sendMessage(recipient: string, message: string): Promise<string> {
    const res = await this.request<MessageSendResponse>("/messages/send", {
      method: "POST",
      body: JSON.stringify({ recipient, message }),
    });
    return res.msg_id;
  }

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
