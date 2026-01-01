/**
 * useConnection Hook Tests
 * 
 * Tests for the connection state management hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnection } from "../useConnection";

// Mock the connection service
vi.mock("../connectionService", () => ({
  connect: vi.fn(),
  isLiveMode: vi.fn(() => false),
}));

import { connect as mockConnect } from "../connectionService";

describe("useConnection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useConnection());

    expect(result.current.state).toBe("idle");
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastResult).toBeNull();
  });

  it("transitions to connecting state when connectTo is called", async () => {
    // Make connect hang indefinitely for this test
    vi.mocked(mockConnect).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useConnection());

    act(() => {
      result.current.connectTo("https://example.com");
    });

    expect(result.current.state).toBe("connecting");
    expect(result.current.isConnecting).toBe(true);
  });

  it("transitions to connected state on success", async () => {
    vi.mocked(mockConnect).mockResolvedValue({
      success: true,
      sessionId: "sess_test123",
      requestId: "req_test123",
      latency: 1500,
    });

    const { result } = renderHook(() => useConnection());

    await act(async () => {
      await result.current.connectTo("https://example.com");
    });

    expect(result.current.state).toBe("connected");
    expect(result.current.isConnected).toBe(true);
    expect(result.current.lastResult?.latency).toBe(1500);
  });

  it("returns to idle state with error on failure", async () => {
    vi.mocked(mockConnect).mockResolvedValue({
      success: false,
      sessionId: "sess_test123",
      requestId: "req_test123",
      latency: 500,
      errorCode: "NETWORK_ERROR",
      errorMessage: "Connection failed",
    });

    const { result } = renderHook(() => useConnection());

    await act(async () => {
      await result.current.connectTo("https://example.com");
    });

    expect(result.current.state).toBe("idle");
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastResult?.errorMessage).toBe("Connection failed");
  });

  it("reset returns to idle state", async () => {
    vi.mocked(mockConnect).mockResolvedValue({
      success: true,
      sessionId: "sess_test123",
      requestId: "req_test123",
      latency: 1500,
    });

    const { result } = renderHook(() => useConnection());

    await act(async () => {
      await result.current.connectTo("https://example.com");
    });

    expect(result.current.state).toBe("connected");

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe("idle");
    expect(result.current.isConnected).toBe(false);
  });

  it("calls onConnect callback when connected", async () => {
    const onConnect = vi.fn();
    
    vi.mocked(mockConnect).mockResolvedValue({
      success: true,
      sessionId: "sess_test123",
      requestId: "req_test123",
      latency: 1500,
    });

    const { result } = renderHook(() => 
      useConnection({ onConnect })
    );

    await act(async () => {
      await result.current.connectTo("https://example.com");
    });

    expect(onConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        sessionId: "sess_test123",
      })
    );
  });

  it("calls onError callback on failure", async () => {
    const onError = vi.fn();
    
    vi.mocked(mockConnect).mockResolvedValue({
      success: false,
      sessionId: "sess_test123",
      requestId: "req_test123",
      latency: 500,
      errorCode: "TIMEOUT",
      errorMessage: "Request timed out",
    });

    const { result } = renderHook(() => 
      useConnection({ onError })
    );

    await act(async () => {
      await result.current.connectTo("https://example.com");
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorCode: "TIMEOUT",
      })
    );
  });

  it("returns isLive as false in mock mode", () => {
    const { result } = renderHook(() => useConnection());
    
    expect(result.current.isLive).toBe(false);
  });
});
