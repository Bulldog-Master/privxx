/**
 * InboxBadge Component
 * 
 * Displays unread message count from POST /message/inbox.
 * Only counts "available" messages (not yet consumed).
 */

import { useEffect, useState, useCallback } from "react";
import { bridgeClient } from "@/api/bridge";
import { cn } from "@/lib/utils";

interface InboxBadgeProps {
  /** Whether the badge should poll for updates */
  enabled?: boolean;
  /** Polling interval in ms (default: 30000) */
  pollInterval?: number;
  className?: string;
}

export function InboxBadge({ 
  enabled = true,
  pollInterval = 30000,
  className 
}: InboxBadgeProps) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadCount = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      setIsLoading(false);
      return;
    }
    
    try {
      // BridgeClient handles session issuance internally
      const response = await bridgeClient.fetchInbox({ limit: 100 });
      // Count only available messages
      const availableCount = response.items?.filter(m => m.state === "available").length ?? 0;
      setCount(availableCount);
    } catch (err) {
      console.debug("[InboxBadge] Failed to fetch count:", err);
      // Don't show error in badge - just keep previous count
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadCount();
    
    // Set up polling
    if (pollInterval > 0 && enabled) {
      const interval = setInterval(loadCount, pollInterval);
      return () => clearInterval(interval);
    }
  }, [loadCount, pollInterval, enabled]);

  // Don't show badge if no messages or still loading initially
  if (isLoading || count === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[1.25rem] h-5 px-1.5",
        "text-xs font-medium",
        "bg-primary text-primary-foreground",
        "rounded-full",
        className
      )}
      aria-label={`${count} unread messages`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
