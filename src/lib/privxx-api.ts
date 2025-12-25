/**
 * Privxx Backend API Client
 * 
 * Model B Architecture: Same-origin proxy endpoints only.
 * Browser NEVER calls bridge directly - all calls go through /api/backend/*
 */

// ============= Types =============

export type HealthRes = { ok: boolean };

export type StatusRes = {
  state: "starting" | "ready" | "error";
  detail?: string;
};

export type SendReq = { recipient: string; message: string };
export type SendRes = { messageId: string; queued: true };

export type MessageItem = {
  id: string;
  from: string;
  body: string;
  timestamp: number;
};

export type MessagesRes = { messages: MessageItem[] };

// ============= Mock Mode Detection =============

const MOCK_MODE =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_USE_MOCKS === "true") ||
  true; // Default to mock mode until real proxy is deployed

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    throw new Error(`API ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }

  return (await res.json()) as T;
}

// ============= Mocks (UI-Safe) =============

async function mockHealth(): Promise<HealthRes> {
  await sleep(150);
  return { ok: true };
}

let mockState: StatusRes["state"] = "starting";
let mockCallCount = 0;

async function mockStatus(): Promise<StatusRes> {
  await sleep(200);
  mockCallCount++;
  // Simulate startup → ready after 2 polls
  if (mockState === "starting" && mockCallCount >= 2) {
    mockState = "ready";
  }
  return mockState === "ready"
    ? { state: "ready" }
    : { state: "starting", detail: "Initializing cMixx tunnel..." };
}

async function mockMessages(): Promise<MessagesRes> {
  await sleep(250);
  return {
    messages: [
      {
        id: "mock-1",
        from: "contact-id",
        body: "Welcome to Privxx (demo mode).",
        timestamp: Date.now() - 60_000,
      },
    ],
  };
}

async function mockSend(_: SendReq): Promise<SendRes> {
  await sleep(250);
  return { messageId: `mock-${Math.random().toString(16).slice(2)}`, queued: true };
}

// ============= Public API =============

export async function health(): Promise<HealthRes> {
  if (MOCK_MODE) return mockHealth();
  return fetchJson<HealthRes>("/api/backend/health");
}

export async function status(): Promise<StatusRes> {
  if (MOCK_MODE) return mockStatus();
  return fetchJson<StatusRes>("/api/backend/status");
}

export async function messages(): Promise<MessagesRes> {
  if (MOCK_MODE) return mockMessages();
  return fetchJson<MessagesRes>("/api/backend/messages");
}

export async function sendMessage(req: SendReq): Promise<SendRes> {
  if (MOCK_MODE) return mockSend(req);
  return fetchJson<SendRes>("/api/backend/send", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ============= Utility Functions =============

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}
