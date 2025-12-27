/**
 * Session Timeout Hook
 * 
 * Tracks user activity and automatically logs out after a period of inactivity.
 * Shows a warning dialog before logout.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseSessionTimeoutOptions {
  /** Timeout duration in milliseconds (default: 15 minutes) */
  timeoutMs?: number;
  /** Warning duration before logout in milliseconds (default: 1 minute) */
  warningMs?: number;
  /** Events to track as user activity */
  activityEvents?: string[];
}

interface SessionTimeoutState {
  /** Whether the warning dialog should be shown */
  showWarning: boolean;
  /** Seconds remaining before logout */
  secondsRemaining: number;
  /** Extend the session */
  extendSession: () => void;
  /** Logout immediately */
  logoutNow: () => void;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_MS = 60 * 1000; // 1 minute before timeout
const DEFAULT_ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): SessionTimeoutState {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    warningMs = DEFAULT_WARNING_MS,
    activityEvents = DEFAULT_ACTIVITY_EVENTS,
  } = options;

  const { isAuthenticated, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await signOut();
  }, [clearAllTimers, signOut]);

  const startWarningCountdown = useCallback(() => {
    const warningSeconds = Math.ceil(warningMs / 1000);
    setSecondsRemaining(warningSeconds);
    setShowWarning(true);

    // Update countdown every second
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMs, handleLogout]);

  const resetTimers = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    if (!isAuthenticated) return;

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      startWarningCountdown();
    }, timeoutMs - warningMs);

    // Set final logout timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [clearAllTimers, isAuthenticated, timeoutMs, warningMs, startWarningCountdown, handleLogout]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  const logoutNow = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  // Handle user activity
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      return;
    }

    const handleActivity = () => {
      // Only reset if warning is not showing
      if (!showWarning) {
        const now = Date.now();
        // Throttle activity detection to avoid excessive resets
        if (now - lastActivityRef.current > 1000) {
          resetTimers();
        }
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start timers
    resetTimers();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [isAuthenticated, activityEvents, showWarning, resetTimers, clearAllTimers]);

  return {
    showWarning,
    secondsRemaining,
    extendSession,
    logoutNow,
  };
}
