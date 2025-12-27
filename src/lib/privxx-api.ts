/**
 * Privxx Bridge API Client
 * 
 * AUTHORITATIVE CONTRACT — Architecture Locked
 * Frontend → Bridge → Backend (xxdk)
 * 
 * Rules:
 * - Frontend NEVER talks directly to backend
 * - Bridge is the ONLY API exposed
 * - Backend remains invisible to frontend
 */

// ============= Configuration =============

// Bridge URL - set via environment or defaults to mock mode
const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";

// Mock mode when no bridge URL configured
const MOCK_MODE = !BRIDGE_URL;

// ============= Types (Bridge Contract) =============

/** GET /status response */
export type StatusRes = {
  status: "ok" | "error";
  backend: "connected" | "disconnected" | "error";
  network: "ready" | "connecting" | "error";
};

/** POST /identity/unlock request */
export type UnlockReq = {
  password: string;
};

/** POST /identity/unlock response */
export type UnlockRes = {
  unlocked: boolean;
};

/** POST /identity/lock response */
export type LockRes = {
  locked: boolean;
};

/** POST /message/send request */
export type SendReq = {
  recipient: string;
  message: string;
};

/** POST /message/send response */
export type SendRes = {
  msg_id: string;
  status: "queued";
};

/** Single message in inbox */
export type MessageItem = {
  from: string;
  message: string;
  timestamp: string; // ISO8601
};

/** GET /message/receive response */
export type MessagesRes = {
  messages: MessageItem[];
};

/** POST /session/refresh response */
export type SessionRefreshRes = {
  token: string;
  expires_in: number;
};

/** Bridge error response */
export type BridgeError = {
  error: string;
};

// ============= Utilities =============

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BRIDGE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((errorBody as BridgeError).error || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}

// ============= Mock Implementations =============

let mockIdentityUnlocked = false;

async function mockStatus(): Promise<StatusRes> {
  await sleep(150);
  return {
    status: "ok",
    backend: "connected",
    network: "ready",
  };
}

async function mockUnlock(req: UnlockReq): Promise<UnlockRes> {
  await sleep(300);
  if (req.password.length < 1) {
    throw new Error("invalid_password");
  }
  mockIdentityUnlocked = true;
  return { unlocked: true };
}

async function mockLock(): Promise<LockRes> {
  await sleep(100);
  mockIdentityUnlocked = false;
  return { locked: true };
}

async function mockSend(_req: SendReq): Promise<SendRes> {
  await sleep(250);
  return {
    msg_id: `mock-${Date.now()}`,
    status: "queued",
  };
}

async function mockReceive(): Promise<MessagesRes> {
  await sleep(200);
  return {
    messages: [
      {
        from: "demo-contact",
        message: "Welcome to Privxx (demo mode)",
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function mockSessionRefresh(): Promise<SessionRefreshRes> {
  await sleep(100);
  return {
    token: `mock-token-${Date.now()}`,
    expires_in: 3600,
  };
}

// ============= Public API =============

/**
 * GET /status
 * Health + readiness check
 */
export async function status(): Promise<StatusRes> {
  return MOCK_MODE
    ? mockStatus()
    : fetchJson<StatusRes>("/status");
}

/**
 * POST /identity/unlock
 * Unlock backend identity (bridge mediates)
 */
export async function unlockIdentity(req: UnlockReq): Promise<UnlockRes> {
  return MOCK_MODE
    ? mockUnlock(req)
    : fetchJson<UnlockRes>("/identity/unlock", {
        method: "POST",
        body: JSON.stringify(req),
      });
}

/**
 * POST /identity/lock
 * Lock backend identity
 */
export async function lockIdentity(): Promise<LockRes> {
  return MOCK_MODE
    ? mockLock()
    : fetchJson<LockRes>("/identity/lock", {
        method: "POST",
      });
}

/**
 * POST /message/send
 * Send a message via xxdk
 */
export async function sendMessage(req: SendReq): Promise<SendRes> {
  return MOCK_MODE
    ? mockSend(req)
    : fetchJson<SendRes>("/message/send", {
        method: "POST",
        body: JSON.stringify(req),
      });
}

/**
 * GET /message/receive
 * Poll or stream received messages
 */
export async function receiveMessages(): Promise<MessagesRes> {
  return MOCK_MODE
    ? mockReceive()
    : fetchJson<MessagesRes>("/message/receive");
}

/**
 * POST /session/refresh
 * Refresh auth/session token
 */
export async function refreshSession(): Promise<SessionRefreshRes> {
  return MOCK_MODE
    ? mockSessionRefresh()
    : fetchJson<SessionRefreshRes>("/session/refresh", {
        method: "POST",
      });
}

// ============= Utility Exports =============

/**
 * Check if running in mock mode (no bridge configured)
 */
export function isMockMode(): boolean {
  return MOCK_MODE;
}

/**
 * Get configured bridge URL (empty in mock mode)
 */
export function getBridgeUrl(): string {
  return BRIDGE_URL;
}

/**
 * Format uptime seconds to human-readable string
 */
export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
