import { useState, useCallback } from "react";
import { bridgeClient } from "@/api/bridge";

export type IdentityState = "locked" | "unlocking" | "unlocked" | "locking";

export function useIdentity() {
  const [state, setState] = useState<IdentityState>("locked");
  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    if (!password.trim()) {
      setError("Password is required");
      return false;
    }

    setState("unlocking");
    setError(null);

    try {
      await bridgeClient.unlock(password);
      setState("unlocked");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlock";
      setError(message === "invalid_password" ? "Invalid password" : message);
      setState("locked");
      return false;
    }
  }, []);

  const lock = useCallback(async (): Promise<boolean> => {
    setState("locking");
    setError(null);

    try {
      await bridgeClient.lock();
      setState("locked");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to lock";
      setError(message);
      setState("unlocked");
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    state,
    isLocked: state === "locked",
    isUnlocked: state === "unlocked",
    isLoading: state === "unlocking" || state === "locking",
    error,
    unlock,
    lock,
    clearError,
  };
}
