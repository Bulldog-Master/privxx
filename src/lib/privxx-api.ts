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
    (import.meta as any).env?.VITE_USE_MOCKS === "true") ||
  (typeof process !== "undefined" &&
    (process as any).env?.NEXT_PUBLIC_USE_MOCKS === "true") ||
  true; // Default to mock mode until real proxy is deployed

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Backend unavailable");
  return (await res.json()) as T;
}

// ============= Mocks (UI-Safe) =============

async function mockHealth(): Promise<HealthRes> {
  await sleep(100);
  return { ok: true };
}

let mockState: StatusRes["state"] = "starting";

async function mockStatus(): Promise<StatusRes> {
  await sleep(200);
  if (mockState === "starting") mockState = "ready";
  return mockState === "ready"
    ? { state: "ready" }
    : { state: "starting", detail: "Starting…" };
}

async function mockMessages(): Promise<MessagesRes> {
  await sleep(200);
  return {
    messages: [
      {
        id: "mock-1",
        from: "contact",
        body: "Welcome to Privxx (demo)",
        timestamp: Date.now(),
      },
    ],
  };
}

async function mockSend(_: SendReq): Promise<SendRes> {
  await sleep(200);
  return { messageId: "mock-msg", queued: true };
}

// ============= Public API =============

export async function health(): Promise<HealthRes> {
  return MOCK_MODE ? mockHealth() : fetchJson<HealthRes>("/api/backend/health");
}

export async function status(): Promise<StatusRes> {
  return MOCK_MODE ? mockStatus() : fetchJson<StatusRes>("/api/backend/status");
}

export async function messages(): Promise<MessagesRes> {
  return MOCK_MODE ? mockMessages() : fetchJson<MessagesRes>("/api/backend/messages");
}

export async function sendMessage(req: SendReq): Promise<SendRes> {
  return MOCK_MODE
    ? mockSend(req)
    : fetchJson<SendRes>("/api/backend/send", {
        method: "POST",
        body: JSON.stringify(req),
      });
}

// ============= Utility Functions =============

export function isMockMode(): boolean {
  return MOCK_MODE;
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
