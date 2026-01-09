/**
 * Connect Flow Integration Tests
 * 
 * Tests for the connect flow with status polling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectWithPolling } from "@/features/connection/hooks/useConnectWithPolling";
import { bridgeClient } from "@/api/bridge";
import { SessionLockedError } from "@/api/bridge/client";

// Mock the bridge client
vi.mock("@/api/bridge", () => ({
  bridgeClient: {
    connect: vi.fn(),
    status: vi.fn(),
  },
  SessionLockedError: class SessionLockedError extends Error {
    code = "session_locked";
    statusCode = 403;
    constructor(message: string) {
      super(message);
      this.name = "SessionLockedError";
    }
  },
}));

describe("useConnectWithPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("happy path", () => {
    it("connects successfully and polls until secure", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const mockStatus = vi.mocked(bridgeClient.status);
      
      // Connect returns success
      mockConnect.mockResolvedValue({ success: true });
      
      // First poll returns connecting, second returns secure
      mockStatus
        .mockResolvedValueOnce({ state: "connecting" })
        .mockResolvedValueOnce({ 
          state: "secure", 
          targetUrl: "https://example.com",
          sessionId: "sim-12345",
          latency: 150
        });

      const { result } = renderHook(() => useConnectWithPolling());

      // Start connect
      await act(async () => {
        result.current.connect("https://example.com");
      });

      // Should be in connecting state first
      expect(result.current.isConnecting).toBe(true);

      // Wait for first status poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Advance timer for next poll (state becomes polling after connect succeeds)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Should be secure now
      expect(result.current.result.statusData?.state).toBe("secure");
      expect(result.current.result.statusData?.sessionId).toBe("sim-12345");
      expect(result.current.result.statusData?.latency).toBe(150);
    });
  });

  describe("timeout after EXACTLY 10 attempts", () => {
    it("stops polling after exactly 10 attempts", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const mockStatus = vi.mocked(bridgeClient.status);
      
      mockConnect.mockResolvedValue({ success: true });
      
      // Status always returns connecting (never secure)
      mockStatus.mockResolvedValue({ state: "connecting" });

      const { result } = renderHook(() => useConnectWithPolling());

      await act(async () => {
        result.current.connect("https://example.com");
      });

      // Wait for all polls (first immediate, then 9 more at 1s intervals)
      await act(async () => {
        // First poll is immediate after connect
        await vi.advanceTimersByTimeAsync(100);
      });

      // 9 more polls at 1s intervals
      for (let i = 0; i < 9; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
      }

      expect(result.current.isTimeout).toBe(true);
      expect(result.current.result.error).toBe("Connection pending — try again");
      // Should be exactly 10 attempts
      expect(result.current.result.pollAttempt).toBe(10);
      // Verify status was called exactly 10 times
      expect(mockStatus).toHaveBeenCalledTimes(10);
    });
  });

  describe("session locked redirect", () => {
    it("calls onSessionLocked when 403 session_locked is received from connect", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const onSessionLocked = vi.fn();
      
      // Connect throws SessionLockedError
      mockConnect.mockRejectedValue(new SessionLockedError("Identity session is locked"));

      const { result } = renderHook(() => useConnectWithPolling(onSessionLocked));

      await act(async () => {
        await result.current.connect("https://example.com");
      });

      expect(result.current.isSessionLocked).toBe(true);
      expect(onSessionLocked).toHaveBeenCalled();
      expect(result.current.result.state).toBe("session_locked");
    });

    it("calls onSessionLocked when 403 session_locked is received during polling", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const mockStatus = vi.mocked(bridgeClient.status);
      const onSessionLocked = vi.fn();
      
      mockConnect.mockResolvedValue({ success: true });
      
      // First poll succeeds, second throws SessionLockedError
      mockStatus
        .mockResolvedValueOnce({ state: "connecting" })
        .mockRejectedValueOnce(new SessionLockedError("Session locked"));

      const { result } = renderHook(() => useConnectWithPolling(onSessionLocked));

      await act(async () => {
        result.current.connect("https://example.com");
      });

      // Wait for polls
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.isSessionLocked).toBe(true);
      expect(onSessionLocked).toHaveBeenCalled();
    });
  });
});
