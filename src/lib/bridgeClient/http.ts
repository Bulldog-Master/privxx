// src/lib/bridgeClient/http.ts
import type { BridgeClientConfig } from "./config";
import type { BridgeError } from "./types";

type HttpMethod = "GET" | "POST";

export async function bridgeFetch<T>(
  path: string,
  method: HttpMethod,
  config: BridgeClientConfig,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = config.getAccessToken ? await config.getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  if (config.getExtraHeaders) {
    Object.assign(headers, await config.getExtraHeaders());
  }

  const res = await fetch(`${config.basePath ?? ""}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const correlationId = res.headers.get("X-Correlation-Id") ?? undefined;

  if (!res.ok) {
    let err: BridgeError = { error: "unknown", message: "Request failed" };
    try {
      err = (await res.json()) as BridgeError;
    } catch {
      // ignore parse errors
    }

    const msg = correlationId
      ? `${err.message} (ref: ${correlationId})`
      : err.message;

    throw new Error(msg);
  }

  // 204 no content
  if (res.status === 204) return {} as T;

  return (await res.json()) as T;
}
