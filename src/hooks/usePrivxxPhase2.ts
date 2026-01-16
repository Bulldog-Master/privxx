/* =========================================================
   PRIVXX — PHASE 2 FRONTEND HOOKS (CANONICAL)
   ---------------------------------------------------------
   • API base: https://api.privxx.app
   • Auth: Supabase JWT (Authorization: Bearer <token>)
   • Phase 2 endpoints only
   • DO NOT MODIFY without version bump
   ========================================================= */

import { useEffect, useState } from "react";

const API_BASE = "https://api.privxx.app";

/* =========================
   SHARED TYPES
   ========================= */

export type HealthResponse = {
  status: "ok";
  version: string;
  xxdkReady: boolean;
};

export type UnlockResponse = {
  success: boolean;
  expiresAt: string;
  ttlSeconds: number;
};

export type ConnectAck = {
  v: number;
  type: "connect_ack";
  requestId: string;
  sessionId: string;
  ack: boolean;
  status: "connected" | "error";
  serverTime: string;
  errorCode?: string;
};

/* =========================
   LOW-LEVEL REQUEST HELPER
   ========================= */

async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || `HTTP ${res.status}`
    );
  }

  return json as T;
}

/* =========================
   HOOK: HEALTH / READINESS
   ========================= */

export function usePrivxxHealth(pollMs = 5000) {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        setError(null);
        const res = await fetch(`${API_BASE}/health`);
        const json = (await res.json()) as HealthResponse;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (alive) setData(json);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : "Network error");
      }
    }

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return { data, error };
}

/* =========================
   HOOK: UNLOCK SESSION
   ========================= */

export function useUnlockSession(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock(password: string): Promise<UnlockResponse> {
    setLoading(true);
    setError(null);
    try {
      return await apiRequest<UnlockResponse>("/unlock", token, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { unlock, loading, error };
}

/* =========================
   HOOK: CONNECT (PHASE 2)
   ========================= */

export function useConnect(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect(targetUrl: string): Promise<ConnectAck> {
    setLoading(true);
    setError(null);

    const envelope = {
      v: 1,
      type: "connect_intent",
      requestId: `cli-${Date.now()}`,
      targetUrl,
    };

    try {
      return await apiRequest<ConnectAck>("/connect", token, {
        method: "POST",
        body: JSON.stringify(envelope),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { connect, loading, error };
}

/* =========================
   UI STATUS HELPERS
   ========================= */

export type PrivxxUiState =
  | "CHECKING"
  | "OFFLINE"
  | "LOCKED"
  | "UNLOCKED"
  | "CONNECTED"
  | "ERROR";

/* Example badge logic (optional UI use):
   - Health error → OFFLINE
   - Health ok + !xxdkReady → CHECKING
   - Health ok + xxdkReady → UNLOCKED (until connect)
*/
