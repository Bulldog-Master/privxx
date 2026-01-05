import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { bridgeClient, isMockMode, BridgeError, type StatusResponse, type BridgeErrorCode } from "@/api/bridge";

export type ConnectionHealth = "healthy" | "degraded" | "offline" | "checking";

export interface BackendStatus {
  /** Bridge connection state: idle, connecting, or secure */
  state: StatusResponse["state"] | "error";
  /** Running in mock mode (no bridge) */
  isMock: boolean;
  /** Overall connection health */
  health: ConnectionHealth;
  /** Last successful response time in ms */
  latencyMs: number | null;
  /** Last error code if any */
  lastErrorCode: BridgeErrorCode | null;
  /** Consecutive failure count */
  failureCount: number;
  /** Last successful check timestamp */
  lastSuccessAt: Date | null;
  /** Last check timestamp */
  lastCheckAt: Date | null;
}

type RateLimitSnapshot = {
  isRateLimited: boolean;
  remainingSec: number;
  retryUntil: number | null;
  formattedTime: string;
  startCountdown: (retryUntil: number) => void;
  clearCountdown: () => void;
};

type StoreSnapshot = {
  status: BackendStatus;
  error: string | null;
  isLoading: boolean;
  rateLimit: RateLimitSnapshot;
};

const initialStatus: BackendStatus = {
  state: "idle",
  isMock: isMockMode(),
  health: "checking",
  latencyMs: null,
  lastErrorCode: null,
  failureCount: 0,
  lastSuccessAt: null,
  lastCheckAt: null,
};

// Health thresholds
const LATENCY_DEGRADED_MS = 2000; // Consider degraded if latency > 2s
const FAILURE_DEGRADED_COUNT = 2; // Degraded after 2 failures
const FAILURE_OFFLINE_COUNT = 4; // Offline after 4 failures

function calculateHealth(
  state: StatusResponse["state"] | "error",
  latencyMs: number | null,
  failureCount: number
): ConnectionHealth {
  if (state === "error" || failureCount >= FAILURE_OFFLINE_COUNT) return "offline";

  if (
    state === "connecting" ||
    failureCount >= FAILURE_DEGRADED_COUNT ||
    (latencyMs !== null && latencyMs > LATENCY_DEGRADED_MS)
  ) {
    return "degraded";
  }

  if (state === "secure") return "healthy";
  if (state === "idle") return "healthy";

  return "degraded";
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ------------------------------
// Singleton store (one poller app-wide)
// ------------------------------

type Listener = () => void;

let store: StoreSnapshot = {
  status: initialStatus,
  error: null,
  isLoading: true,
  rateLimit: {
    isRateLimited: false,
    remainingSec: 0,
    retryUntil: null,
    formattedTime: "0:00",
    startCountdown: () => {},
    clearCountdown: () => {},
  },
};

const listeners = new Set<Listener>();
const pollRequests = new Map<symbol, number>();

let pollTimer: number | null = null;
let countdownTimer: number | null = null;
let inFlight: Promise<void> | null = null;

function notify() {
  for (const l of listeners) l();
}

function setStore(next: Partial<StoreSnapshot>) {
  store = { ...store, ...next };
  notify();
}

function setRateLimit(next: Partial<RateLimitSnapshot>) {
  store = {
    ...store,
    rateLimit: {
      ...store.rateLimit,
      ...next,
    },
  };
  notify();
}

function getPollMs() {
  if (pollRequests.size === 0) return 30000;
  return Math.min(...Array.from(pollRequests.values()));
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function stopCountdown() {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function clearCountdown() {
  stopCountdown();
  setRateLimit({
    isRateLimited: false,
    remainingSec: 0,
    retryUntil: null,
    formattedTime: "0:00",
  });
}

function startCountdown(retryUntil: number) {
  stopCountdown();

  const update = () => {
    const remainingSec = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
    if (remainingSec <= 0) {
      clearCountdown();
      // Kick a fresh tick after cooldown
      void tick({ force: true });
      return;
    }
    setRateLimit({
      isRateLimited: true,
      remainingSec,
      retryUntil,
      formattedTime: formatTime(remainingSec),
    });
  };

  update();
  countdownTimer = window.setInterval(update, 1000);
}

// Attach stable countdown fns
store.rateLimit.startCountdown = startCountdown;
store.rateLimit.clearCountdown = clearCountdown;

async function tick({ force }: { force: boolean }) {
  // privacy/perf: pause polling when backgrounded
  if (!force && document.hidden) return;

  // avoid hammering while rate limited
  if (!force && store.rateLimit.isRateLimited) return;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    setStore({ isLoading: true });
    const startTime = performance.now();
    const checkTime = new Date();

    try {
      const s = await bridgeClient.status();
      const latencyMs = Math.round(performance.now() - startTime);

      clearCountdown();

      setStore({
        status: {
          state: s.state,
          isMock: isMockMode(),
          health: calculateHealth(s.state, latencyMs, 0),
          latencyMs,
          lastErrorCode: null,
          failureCount: 0,
          lastSuccessAt: checkTime,
          lastCheckAt: checkTime,
        },
        error: null,
        isLoading: false,
      });
    } catch (err) {
      // Handle explicit rate limiting without incrementing failure counters
      if (err instanceof BridgeError && err.code === "RATE_LIMITED") {
        const retryAfterSec = err.retryAfterSec ?? 60;
        startCountdown(Date.now() + retryAfterSec * 1000);

        setStore({
          status: {
            ...store.status,
            isMock: isMockMode(),
            health: "degraded",
            latencyMs: null,
            lastErrorCode: "RATE_LIMITED",
            lastCheckAt: checkTime,
          },
          error: "RATE_LIMITED",
          isLoading: false,
        });
        return;
      }

      const nextFailureCount = (store.status.failureCount ?? 0) + 1;
      const errorCode: BridgeErrorCode = err instanceof BridgeError ? err.code : "NETWORK_ERROR";

      setStore({
        status: {
          state: "error",
          isMock: isMockMode(),
          health: calculateHealth("error", null, nextFailureCount),
          latencyMs: null,
          lastErrorCode: errorCode,
          failureCount: nextFailureCount,
          lastSuccessAt: store.status.lastSuccessAt,
          lastCheckAt: checkTime,
        },
        error: errorCode,
        isLoading: false,
      });
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

function ensurePolling() {
  const pollMs = getPollMs();

  if (pollTimer) {
    // If interval already correct, do nothing
    // (No reliable way to read interval; restart only when pollMs changes by stopping/starting.)
    stopPolling();
  }

  void tick({ force: true });
  pollTimer = window.setInterval(() => void tick({ force: false }), pollMs);
}

function subscribe(listener: Listener, pollMs: number, id: symbol) {
  listeners.add(listener);
  pollRequests.set(id, pollMs);
  ensurePolling();

  const onVisibility = () => {
    // When returning to foreground, do a fast refresh (but still respect rate limit)
    if (!document.hidden) void tick({ force: false });
  };

  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    listeners.delete(listener);
    pollRequests.delete(id);
    document.removeEventListener("visibilitychange", onVisibility);

    if (listeners.size === 0) {
      stopPolling();
      stopCountdown();
      inFlight = null;
      pollRequests.clear();
      // Keep last snapshot around to avoid UI flicker on remount
    } else {
      ensurePolling();
    }
  };
}

// ------------------------------
// Public hook
// ------------------------------

export function useBackendStatus(pollMs = 30000) {
  const idRef = useRef<symbol>();
  if (!idRef.current) idRef.current = Symbol("useBackendStatus");

  const snapshot = useSyncExternalStore(
    (listener) => subscribe(listener, pollMs, idRef.current!),
    () => store,
    () => store
  );

  const refetch = useMemo(() => {
    return () => {
      void tick({ force: true });
    };
  }, []);

  return {
    status: snapshot.status,
    error: snapshot.error,
    isLoading: snapshot.isLoading,
    refetch,
    rateLimit: snapshot.rateLimit,
  };
}
