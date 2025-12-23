/**
 * Privxx Backend API Client
 * 
 * Connects to the live backend at privxx.app
 * Based on: docs/PRIVXX-BACKEND-HANDOFF-LOCKED.md
 */

const BASE_URL = import.meta.env.PROD 
  ? 'https://privxx.app' 
  : 'https://privxx.app'; // Use production backend for dev too

// ============= Types =============

export interface CmixxStatusResponse {
  ok: boolean;
  mode: 'real' | 'simulated';
  mixnet: string;
  ready: boolean;
  phase: string;
  uptimeSec: number;
  inboxCount: number;
  now: number;
}

export interface CmixxInboxResponse {
  ok: boolean;
  mode: 'real' | 'simulated';
  count: number;
  items: unknown[];
}

export interface CmixxSendRequest {
  to: string;
  body: string;
}

export interface CmixxSendResponse {
  ok: boolean;
  mode: 'real' | 'simulated';
  error?: string;
}

export interface XxdkInfoResponse {
  ok: boolean;
  mode: 'real' | 'simulated';
  dataDir: string;
  ndfPath: string;
  phase: string;
  ready: boolean;
  uptimeSec: number;
  now: number;
  note: string;
}

export interface XxdkClientResponse {
  ok: boolean;
  mode: 'real' | 'simulated';
  transmissionId: string;
  receptionId: string;
  now: number;
  note: string;
}

export interface ApiError {
  ok: false;
  error: string;
  status: number;
}

// ============= API Functions =============

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | ApiError> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return data as T;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * GET /cmixx/status
 * Mixnet health & readiness
 */
export async function getCmixxStatus(): Promise<CmixxStatusResponse | ApiError> {
  return fetchApi<CmixxStatusResponse>('/cmixx/status');
}

/**
 * GET /cmixx/inbox
 * Read-only inbox state
 */
export async function getCmixxInbox(): Promise<CmixxInboxResponse | ApiError> {
  return fetchApi<CmixxInboxResponse>('/cmixx/inbox');
}

/**
 * POST /cmixx/send
 * Message sending (NOT YET ENABLED - returns 501)
 */
export async function postCmixxSend(request: CmixxSendRequest): Promise<CmixxSendResponse | ApiError> {
  return fetchApi<CmixxSendResponse>('/cmixx/send', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * GET /xxdk/info
 * Safe backend + xxdk state info
 */
export async function getXxdkInfo(): Promise<XxdkInfoResponse | ApiError> {
  return fetchApi<XxdkInfoResponse>('/xxdk/info');
}

/**
 * GET /xxdk/client
 * Identity exposure (read-only)
 */
export async function getXxdkClient(): Promise<XxdkClientResponse | ApiError> {
  return fetchApi<XxdkClientResponse>('/xxdk/client');
}

// ============= Utility Functions =============

export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'ok' in response && (response as ApiError).ok === false && 'status' in response;
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
