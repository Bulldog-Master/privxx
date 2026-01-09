/**
 * Zero-Date Locked Test
 * 
 * Tests that unlocked:false + expiresAt:"0001-01-01T00:00:00Z" results in locked state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { IdentityProvider, useIdentity } from "@/features/identity/context/IdentityContext";
import { bridgeClient } from "@/api/bridge";

// Mock the bridge client
vi.mock("@/api/bridge", () => ({
  bridgeClient: {
    getUnlockStatus: vi.fn(),
    unlock: vi.fn(),
    lock: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe("Zero-date locked handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(IdentityProvider, null, children)
  );

  it("treats unlocked:false with expiresAt:0001-01-01T00:00:00Z as LOCKED", async () => {
    const mockGetUnlockStatus = vi.mocked(bridgeClient.getUnlockStatus);
    
    // LIVE locked response with zero-date
    mockGetUnlockStatus.mockResolvedValue({
      unlocked: false,
      expiresAt: "0001-01-01T00:00:00Z",
    });

    const { result } = renderHook(() => useIdentity(), { wrapper });

    // Wait for initialization via act
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialized).toBe(true);

    // Should be LOCKED, not unlocked
    expect(result.current.isLocked).toBe(true);
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.state).toBe("locked");
    expect(result.current.unlockExpiresAt).toBeNull();
  });

  it("treats unlocked:true with expiresAt:0001-01-01T00:00:00Z as UNLOCKED (unknown TTL)", async () => {
    const mockGetUnlockStatus = vi.mocked(bridgeClient.getUnlockStatus);
    
    // Edge case: unlocked with zero-date (should treat as unlocked with unknown TTL)
    mockGetUnlockStatus.mockResolvedValue({
      unlocked: true,
      expiresAt: "0001-01-01T00:00:00Z",
    });

    const { result } = renderHook(() => useIdentity(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialized).toBe(true);

    // Should be UNLOCKED (zero-date is acceptable for unknown TTL when unlocked=true)
    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.isLocked).toBe(false);
    expect(result.current.state).toBe("unlocked");
    expect(result.current.unlockExpiresAt).toBeNull(); // TTL unknown
  });

  it("treats unlocked:false with no expiresAt as LOCKED", async () => {
    const mockGetUnlockStatus = vi.mocked(bridgeClient.getUnlockStatus);
    
    mockGetUnlockStatus.mockResolvedValue({
      unlocked: false,
    });

    const { result } = renderHook(() => useIdentity(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialized).toBe(true);

    expect(result.current.isLocked).toBe(true);
    expect(result.current.state).toBe("locked");
  });
});
