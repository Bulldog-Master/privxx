/**
 * SessionLockedError Tests
 * 
 * Tests that 403 with code "session_locked" throws SessionLockedError
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BridgeClient, SessionLockedError, BridgeError } from "@/api/bridge/client";

describe("SessionLockedError handling", () => {
  let client: BridgeClient;

  beforeEach(() => {
    // Mock fetch globally
    vi.stubGlobal("fetch", vi.fn());
    
    client = new BridgeClient({
      baseUrl: "https://test.example.com",
      getAccessToken: async () => "test-token",
      anonKey: "test-anon-key",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws SessionLockedError on 403 with code session_locked", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        code: "session_locked",
        error: "forbidden",
        message: "Identity session is locked. Call POST /unlock first.",
      }),
      headers: new Headers(),
    } as Response);

    await expect(client.connect("https://example.com")).rejects.toThrow(SessionLockedError);
  });

  it("SessionLockedError has correct properties", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        code: "session_locked",
        error: "forbidden",
        message: "Identity session is locked. Call POST /unlock first.",
      }),
      headers: new Headers(),
    } as Response);

    try {
      await client.connect("https://example.com");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SessionLockedError);
      const sessionErr = err as SessionLockedError;
      expect(sessionErr.code).toBe("session_locked");
      expect(sessionErr.statusCode).toBe(403);
      expect(sessionErr.message).toBe("Identity session is locked. Call POST /unlock first.");
    }
  });

  it("throws BridgeError on 403 without session_locked code", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: "forbidden",
        message: "Access denied",
      }),
      headers: new Headers(),
    } as Response);

    await expect(client.connect("https://example.com")).rejects.toThrow(BridgeError);
  });

  it("correctly identifies session_locked across different endpoints", async () => {
    const sessionLockedResponse = {
      ok: false,
      status: 403,
      json: async () => ({
        code: "session_locked",
        error: "forbidden",
        message: "Session locked",
      }),
      headers: new Headers(),
    } as Response;

    // Test with status endpoint
    vi.mocked(fetch).mockResolvedValue(sessionLockedResponse);
    await expect(client.status()).rejects.toThrow(SessionLockedError);
  });
});
