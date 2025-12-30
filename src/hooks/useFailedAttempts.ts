/**
 * Failed Login Attempts Hook
 * 
 * Tracks failed authentication attempts per email to determine
 * when CAPTCHA verification should be required.
 * Uses in-memory storage (no persistence for privacy).
 */

import { useState, useCallback } from "react";

const CAPTCHA_THRESHOLD = 3;
const ATTEMPT_RESET_TIME_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
}

// In-memory storage for failed attempts (privacy-first: no localStorage)
const attemptStore = new Map<string, AttemptRecord>();

export function useFailedAttempts() {
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);

  /**
   * Check if an email requires CAPTCHA verification
   */
  const checkRequiresCaptcha = useCallback((email: string): boolean => {
    const normalizedEmail = email.toLowerCase().trim();
    const record = attemptStore.get(normalizedEmail);
    
    if (!record) {
      return false;
    }
    
    // Reset if attempts are old
    const now = Date.now();
    if (now - record.firstAttemptAt > ATTEMPT_RESET_TIME_MS) {
      attemptStore.delete(normalizedEmail);
      return false;
    }
    
    return record.count >= CAPTCHA_THRESHOLD;
  }, []);

  /**
   * Record a failed authentication attempt
   */
  const recordFailedAttempt = useCallback((email: string): boolean => {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const record = attemptStore.get(normalizedEmail);
    
    if (!record || now - record.firstAttemptAt > ATTEMPT_RESET_TIME_MS) {
      // Start fresh record
      attemptStore.set(normalizedEmail, {
        count: 1,
        firstAttemptAt: now,
      });
      return false;
    }
    
    // Increment existing record
    record.count += 1;
    attemptStore.set(normalizedEmail, record);
    
    const needsCaptcha = record.count >= CAPTCHA_THRESHOLD;
    setRequiresCaptcha(needsCaptcha);
    return needsCaptcha;
  }, []);

  /**
   * Clear failed attempts for an email (on successful login)
   */
  const clearAttempts = useCallback((email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    attemptStore.delete(normalizedEmail);
    setRequiresCaptcha(false);
  }, []);

  /**
   * Get current attempt count for an email
   */
  const getAttemptCount = useCallback((email: string): number => {
    const normalizedEmail = email.toLowerCase().trim();
    const record = attemptStore.get(normalizedEmail);
    
    if (!record) return 0;
    
    const now = Date.now();
    if (now - record.firstAttemptAt > ATTEMPT_RESET_TIME_MS) {
      attemptStore.delete(normalizedEmail);
      return 0;
    }
    
    return record.count;
  }, []);

  /**
   * Update CAPTCHA requirement state for a given email
   */
  const updateCaptchaRequirement = useCallback((email: string) => {
    setRequiresCaptcha(checkRequiresCaptcha(email));
  }, [checkRequiresCaptcha]);

  return {
    requiresCaptcha,
    checkRequiresCaptcha,
    recordFailedAttempt,
    clearAttempts,
    getAttemptCount,
    updateCaptchaRequirement,
    threshold: CAPTCHA_THRESHOLD,
  };
}

export default useFailedAttempts;
