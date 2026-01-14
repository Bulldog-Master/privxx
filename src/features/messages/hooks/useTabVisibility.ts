/**
 * useTabVisibility Hook
 * 
 * Tracks browser tab visibility state.
 * Returns false when tab is backgrounded, true when active.
 * 
 * Use to pause polling/fetching when user isn't looking.
 * Phase-1 compatible: No protocol changes, frontend-only optimization.
 */

import { useEffect, useState } from "react";

export function useTabVisibility(): boolean {
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVisibilityChange = () => {
      setTabVisible(document.visibilityState === "visible");
    };

    // Set initial state
    onVisibilityChange();

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return tabVisible;
}
