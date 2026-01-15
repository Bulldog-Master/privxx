// src/api/bridge/health.ts
// Simple health check for Phase 1 integration testing

export type HealthResponse = {
  status: "ok";
  version: string;
  xxdkReady: boolean;
};

export async function fetchHealth(baseUrl = "https://api.privxx.app"): Promise<HealthResponse> {
  const res = await fetch(`${baseUrl}/health`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`health failed: ${res.status} ${res.statusText} ${text}`.trim());
  }

  return res.json();
}
