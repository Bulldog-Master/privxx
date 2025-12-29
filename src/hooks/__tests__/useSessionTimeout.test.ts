/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionTimeout } from "../useSessionTimeout";

// Mock useAuth
const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    signOut: mockSignOut,
  }),
}));

describe("useSessionTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSignOut.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show warning initially", () => {
    const { result } = renderHook(() =>
      useSessionTimeout({ timeoutMs: 5000, warningMs: 2000 })
    );

    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
  });

  it("shows warning before timeout expires", () => {
    const { result } = renderHook(() =>
      useSessionTimeout({ timeoutMs: 5000, warningMs: 2000 })
    );

    // Advance to warning phase (5000 - 2000 = 3000ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.showWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(2); // 2000ms = 2 seconds
  });

  it("counts down seconds during warning phase", () => {
    const { result } = renderHook(() =>
      useSessionTimeout({ timeoutMs: 5000, warningMs: 2000 })
    );

    // Advance to warning phase
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsRemaining).toBe(2);

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.secondsRemaining).toBe(1);
  });

  it("calls signOut when timeout expires", async () => {
    renderHook(() =>
      useSessionTimeout({ timeoutMs: 5000, warningMs: 2000 })
    );

    // Advance past full timeout
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("resets timers when extendSession is called", () => {
    const { result } = renderHook(() =>
      useSessionTimeout({ timeoutMs: 5000, warningMs: 2000 })
    );

    // Advance to warning phase
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.showWarning).toBe(true);

    // Extend session
    act(() => {
      result.current.extendSession();
    });

    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
  });

  it("logs out immediately when logoutNow is called", async () => {
    const { result } = renderHook(() =>
      useSessionTimeout({ timeoutMs: 5000, warningMs: 2000 })
    );

    act(() => {
      result.current.logoutNow();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });
});
