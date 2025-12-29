/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

vi.mock("@/features/identity/context/IdentityContext", () => ({
  useIdentity: vi.fn(),
}));

vi.mock("@/hooks/useCountdown", () => ({
  useCountdown: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

import { useIdentityActions } from "../useIdentityActions";
import { useIdentity } from "@/features/identity/context/IdentityContext";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";

describe("useIdentityActions", () => {
  const mockUseIdentity = useIdentity as ReturnType<typeof vi.fn>;
  const mockUseCountdown = useCountdown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountdown.mockReturnValue({
      formatted: "5:00",
      timeLeft: 300,
      isExpired: false,
    });
  });

  it("returns correct state when identity is none", () => {
    mockUseIdentity.mockReturnValue({
      state: "none",
      isNone: true,
      isLocked: false,
      isUnlocked: false,
      isLoading: false,
      unlockExpiresAt: null,
      createIdentity: vi.fn(),
      unlock: vi.fn(),
      lock: vi.fn(),
    });

    const { result } = renderHook(() => useIdentityActions());

    expect(result.current.isNone).toBe(true);
    expect(result.current.isUnlocked).toBe(false);
    expect(result.current.getStatusText()).toBe("Create your secure identity");
  });

  it("returns correct state when identity is unlocked", () => {
    const expiresAt = new Date(Date.now() + 300000);
    mockUseIdentity.mockReturnValue({
      state: "unlocked",
      isNone: false,
      isLocked: false,
      isUnlocked: true,
      isLoading: false,
      unlockExpiresAt: expiresAt,
      createIdentity: vi.fn(),
      unlock: vi.fn(),
      lock: vi.fn(),
    });

    const { result } = renderHook(() => useIdentityActions());

    expect(result.current.isUnlocked).toBe(true);
    expect(result.current.isExpiringSoon).toBe(false);
  });

  it("detects expiring soon state", () => {
    mockUseIdentity.mockReturnValue({
      state: "unlocked",
      isNone: false,
      isLocked: false,
      isUnlocked: true,
      isLoading: false,
      unlockExpiresAt: new Date(),
      createIdentity: vi.fn(),
      unlock: vi.fn(),
      lock: vi.fn(),
    });

    mockUseCountdown.mockReturnValue({
      formatted: "1:00",
      timeLeft: 60,
      isExpired: false,
    });

    const { result } = renderHook(() => useIdentityActions());

    expect(result.current.isExpiringSoon).toBe(true);
  });

  it("calls createIdentity and shows toast on success", async () => {
    const mockCreateIdentity = vi.fn().mockResolvedValue(true);
    mockUseIdentity.mockReturnValue({
      state: "none",
      isNone: true,
      isLocked: false,
      isUnlocked: false,
      isLoading: false,
      unlockExpiresAt: null,
      createIdentity: mockCreateIdentity,
      unlock: vi.fn(),
      lock: vi.fn(),
    });

    const { result } = renderHook(() => useIdentityActions());

    await act(async () => {
      await result.current.handleCreateIdentity();
    });

    expect(mockCreateIdentity).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Secure identity created");
  });

  it("calls unlock and shows toast on success", async () => {
    const mockUnlock = vi.fn().mockResolvedValue(true);
    mockUseIdentity.mockReturnValue({
      state: "locked",
      isNone: false,
      isLocked: true,
      isUnlocked: false,
      isLoading: false,
      unlockExpiresAt: null,
      createIdentity: vi.fn(),
      unlock: mockUnlock,
      lock: vi.fn(),
    });

    const { result } = renderHook(() => useIdentityActions());

    await act(async () => {
      await result.current.handleUnlock();
    });

    expect(mockUnlock).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Identity unlocked");
  });

  it("calls lock and shows toast on success", async () => {
    const mockLock = vi.fn().mockResolvedValue(true);
    mockUseIdentity.mockReturnValue({
      state: "unlocked",
      isNone: false,
      isLocked: false,
      isUnlocked: true,
      isLoading: false,
      unlockExpiresAt: null,
      createIdentity: vi.fn(),
      unlock: vi.fn(),
      lock: mockLock,
    });

    const { result } = renderHook(() => useIdentityActions());

    await act(async () => {
      await result.current.handleLock();
    });

    expect(mockLock).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Identity locked");
  });
});
