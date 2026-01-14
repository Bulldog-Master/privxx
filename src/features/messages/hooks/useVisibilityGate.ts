/**
 * useVisibilityGate Hook
 * 
 * IntersectionObserver-based visibility detection for lazy loading.
 * Returns true when the referenced element is visible in viewport.
 * 
 * Phase-1 compatible: No protocol changes, frontend-only optimization.
 */

import { useEffect, useState, type RefObject } from "react";

export function useVisibilityGate(
  ref: RefObject<Element>,
  threshold = 0.2
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(Boolean(entry.isIntersecting)),
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);

  return isVisible;
}
