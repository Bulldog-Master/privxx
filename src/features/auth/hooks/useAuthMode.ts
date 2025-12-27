/**
 * Auth Mode Hook
 * 
 * Manages authentication mode state based on URL params and user interactions.
 */

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export type AuthMode = 
  | "signin" 
  | "signup" 
  | "magic-link" 
  | "passkey" 
  | "forgot" 
  | "reset";

export function useAuthMode() {
  const [searchParams] = useSearchParams();
  
  // Check if returning from password reset link
  const resetMode = searchParams.get("mode") === "reset";
  
  const [mode, setModeState] = useState<AuthMode>(resetMode ? "reset" : "signin");

  // Sync with URL params on mount
  useEffect(() => {
    if (resetMode && mode !== "reset") {
      setModeState("reset");
    }
  }, [resetMode, mode]);

  const setMode = useCallback((newMode: AuthMode) => {
    setModeState(newMode);
  }, []);

  return { mode, setMode };
}
