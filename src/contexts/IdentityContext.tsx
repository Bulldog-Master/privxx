import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { bridgeClient } from "@/api/bridge";

export type IdentityState = "locked" | "unlocking" | "unlocked" | "locking";

interface IdentityContextValue {
  state: IdentityState;
  isLocked: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<boolean>;
  clearError: () => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
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

  return (
    <IdentityContext.Provider
      value={{
        state,
        isLocked: state === "locked",
        isUnlocked: state === "unlocked",
        isLoading: state === "unlocking" || state === "locking",
        error,
        unlock,
        lock,
        clearError,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity must be used within IdentityProvider");
  }
  return context;
}
