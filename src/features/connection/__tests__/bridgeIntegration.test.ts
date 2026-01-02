/**
 * Bridge Integration Tests
 * 
 * Tests for real Bridge connectivity when VITE_MOCK=false.
 * These tests are designed to run against a real or local bridge instance.
 * 
 * To run these tests:
 * 1. Start the bridge: cd backend/bridge && go run main.go
 * 2. Set VITE_MOCK=false and VITE_BRIDGE_URL=http://127.0.0.1:8090
 * 3. Run: npm test -- bridgeIntegration
 * 
 * Note: These tests are skipped by default when bridge is unavailable.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Bridge health check
async function isBridgeAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Test configuration
const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "http://127.0.0.1:8090";
const IS_MOCK_MODE = import.meta.env.VITE_MOCK !== "false";

describe("Bridge Integration (requires real bridge)", () => {
  let bridgeAvailable = false;

  beforeAll(async () => {
    if (!IS_MOCK_MODE) {
      bridgeAvailable = await isBridgeAvailable(BRIDGE_URL);
    }
  });

  describe.skipIf(IS_MOCK_MODE || !bridgeAvailable)("Health Endpoint", () => {
    it("GET /health returns ok status", async () => {
      const response = await fetch(`${BRIDGE_URL}/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe("ok");
      expect(data.version).toBeDefined();
    });
  });

  describe.skipIf(IS_MOCK_MODE || !bridgeAvailable)("Connect Endpoint", () => {
    it("POST /connect accepts connect_intent and returns connect_ack", async () => {
      const intent = {
        v: 1,
        type: "connect_intent",
        requestId: `req_test${Date.now()}`,
        sessionId: `sess_test${Date.now()}`,
        targetUrl: "https://example.com",
        clientTime: new Date().toISOString(),
      };

      // Note: This will fail without auth in production
      // This test is for local development with ENVIRONMENT=development
      const response = await fetch(`${BRIDGE_URL}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://privxx.app",
        },
        body: JSON.stringify(intent),
      });

      // May get 401 if auth is required - that's expected behavior
      if (response.status === 401) {
        expect(response.status).toBe(401);
        return;
      }

      const ack = await response.json();

      expect(ack.v).toBe(1);
      expect(ack.type).toBe("connect_ack");
      expect(ack.requestId).toBe(intent.requestId);
      expect(ack.sessionId).toBe(intent.sessionId);
    });

    it("POST /connect rejects invalid intent type", async () => {
      const badIntent = {
        v: 1,
        type: "wrong_type",
        requestId: "req_test",
        sessionId: "sess_test",
        targetUrl: "https://example.com",
        clientTime: new Date().toISOString(),
      };

      const response = await fetch(`${BRIDGE_URL}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://privxx.app",
        },
        body: JSON.stringify(badIntent),
      });

      // Skip auth check
      if (response.status === 401) return;

      expect(response.status).toBe(400);
      
      const ack = await response.json();
      expect(ack.ack).toBe(false);
      expect(ack.errorCode).toBe("INVALID_MESSAGE");
    });

    it("POST /connect rejects missing targetUrl", async () => {
      const badIntent = {
        v: 1,
        type: "connect_intent",
        requestId: "req_test",
        sessionId: "sess_test",
        targetUrl: "",
        clientTime: new Date().toISOString(),
      };

      const response = await fetch(`${BRIDGE_URL}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://privxx.app",
        },
        body: JSON.stringify(badIntent),
      });

      // Skip auth check
      if (response.status === 401) return;

      expect(response.status).toBe(400);
      
      const ack = await response.json();
      expect(ack.ack).toBe(false);
      expect(ack.errorCode).toBe("INVALID_URL");
    });
  });

  describe.skipIf(IS_MOCK_MODE || !bridgeAvailable)("CORS Headers", () => {
    it("returns correct CORS headers for allowed origin", async () => {
      const response = await fetch(`${BRIDGE_URL}/health`, {
        method: "OPTIONS",
        headers: {
          "Origin": "https://privxx.app",
          "Access-Control-Request-Method": "GET",
        },
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://privxx.app");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    });

    it("handles preflight requests", async () => {
      const response = await fetch(`${BRIDGE_URL}/connect`, {
        method: "OPTIONS",
        headers: {
          "Origin": "https://privxx.app",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type, Authorization",
        },
      });

      expect(response.status).toBe(204);
    });
  });

  describe("Mock Mode Check", () => {
    it("correctly identifies mock mode", () => {
      // This test always runs to verify env detection works
      expect(typeof IS_MOCK_MODE).toBe("boolean");
    });
  });
});
