/**
 * Inbox Component (C2 Production Model)
 * 
 * Displays messages and handles locked state.
 * Unlock is re-auth based, not password based.
 */

import { useTranslation } from "react-i18next";
import { RefreshCw, Lock, AlertCircle, Inbox as InboxIcon, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentity } from "@/features/identity";
import { IdentityUnlockForm } from "@/features/identity/components/IdentityUnlockForm";
import type { DemoMessage } from "./types";

interface InboxProps {
  messages: DemoMessage[];
  isLoading: boolean;
  isWarmingUp?: boolean;
  error?: string;
  onRefresh: () => void;
  isUnlocked: boolean;
}

function formatTimestamp(ts: number): string {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "";
  }
}

export function Inbox({ 
  messages, 
  isLoading, 
  isWarmingUp = false,
  error, 
  onRefresh, 
  isUnlocked 
}: InboxProps) {
  const { t } = useTranslation();
  const { autoRetry, status } = useBackendStatusContext();
  const { isAuthenticated, isLoading: authLoading, isInitialized: authInitialized } = useAuth();
  const { isInitialized: identityInitialized, isLoading: identityLoading } = useIdentity();
  
  // Determine if this is a network-level error that has auto-retry
  const isNetworkError = error && (
    error.includes("Network") || 
    error.includes("network") || 
    error.includes("Failed to fetch") ||
    status.lastErrorCode === "NETWORK_ERROR" ||
    status.lastErrorCode === "TIMEOUT"
  );

  // Show stable skeleton ONLY while identity is initializing for the first time
  // Do NOT show skeleton on subsequent loading states (prevents flashing)
  if (!identityInitialized) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // While identity is loading (unlock/lock in progress) or warming up post-unlock,
  // show skeleton to prevent any flashing of locked/error states.
  if (identityLoading || isWarmingUp) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Locked state
  // - While auth is still initializing, don't flash "Sign In Required".
  // - If not signed in, we can't unlock (bridge requires auth headers)
  // - If signed in, prompt for identity password
  if (!isUnlocked) {
    if (authLoading || !authInitialized) {
      return (
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-6 text-center px-4">
        <Lock className="h-6 w-6 text-primary/60 mb-2" />
        <h3 className="text-sm font-semibold mb-1 text-primary/90">
          {isAuthenticated
            ? t("inboxLockedTitle", "Identity Locked")
            : t("authRequired", "Sign In Required")}
        </h3>
        <p className="text-xs text-primary/60 mb-4">
          {isAuthenticated
            ? t("inboxLockedBody", "Unlock your identity to view messages")
            : t("authRequiredBody", "Sign in to unlock your identity and view messages")}
        </p>

        {isAuthenticated ? (
          <div className="w-full max-w-xs">
            <IdentityUnlockForm />
          </div>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">{t("common.signIn", "Sign In")}</Link>
          </Button>
        )}
      </div>
    );
  }

  // Loading state (only show skeleton on initial load)
  if (isLoading && messages.length === 0) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Error state with auto-retry support
  if (error) {
    const showAutoRetry = isNetworkError && autoRetry.isWaiting;
    const isExhausted = isNetworkError && autoRetry.isExhausted;
    
    // Calculate progress for countdown visual (max 30 seconds)
    const progressPercent = showAutoRetry 
      ? Math.max(0, (autoRetry.remainingSec / 30) * 100)
      : 0;
    
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center px-4">
        <AlertCircle className="h-6 w-6 text-destructive mb-2" />
        <h3 className="text-sm font-semibold mb-1">
          {t("inboxErrorTitle", "Unable to load messages")}
        </h3>
        <p className="text-xs text-muted-foreground mb-1">
          {error}
          {status.failureCount > 1 && (
            <span className="text-muted-foreground/60">
              {" "}({status.failureCount} {t("failures", "failures")})
            </span>
          )}
        </p>
        
        {/* Auto-retry countdown */}
        {showAutoRetry && (
          <div className="w-full max-w-xs mt-3 p-3 bg-background/50 rounded-md border border-border/50">
            <div className="flex items-center justify-center gap-2 text-sm mb-2">
              <Timer className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-muted-foreground">
                {t("connection.error.autoRetrying", "Retrying in")}
              </span>
              <span className="font-mono font-semibold text-foreground">
                {autoRetry.formattedTime}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-xs text-muted-foreground/70 mt-2">
              {t("connection.error.attempt", "Attempt {{current}} of {{max}}", {
                current: autoRetry.attempt,
                max: autoRetry.maxRetries,
              })}
            </p>
          </div>
        )}
        
        {/* Exhausted message */}
        {isExhausted && (
          <p className="text-xs text-destructive/80 mt-2 max-w-xs">
            {t(
              "connection.error.retriesExhausted",
              "Automatic retries exhausted. Please check your connection and try manually."
            )}
          </p>
        )}
        
        <div className="flex gap-2 mt-3">
          {/* Retry Now button (when auto-retrying) */}
          {showAutoRetry && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={autoRetry.retryNow}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("connection.error.retryNow", "Retry Now")}
            </Button>
          )}
          
          {/* Standard retry (when not auto-retrying) */}
          {!showAutoRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("retry", "Retry")}
            </Button>
          )}
          
          {/* Cancel auto-retry */}
          {showAutoRetry && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={autoRetry.cancel}
            >
              {t("common.cancel", "Cancel")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <InboxIcon className="h-6 w-6 text-primary/60 mb-2" />
        <h3 className="text-sm font-semibold mb-1 text-primary/90">
          {t("inboxEmptyTitle", "No messages yet")}
        </h3>
        <p className="text-xs text-primary/60">
          {t("inboxEmptyBody", "Send a message to get started")}
        </p>
      </div>
    );
  }

  // Messages list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20">
        <h3 className="text-sm font-medium text-primary/90">
          {t("inboxTitle", "Messages")} ({messages.length})
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRefresh}
          className="h-8 w-8"
          aria-label={t("refreshMessages", "Refresh messages")}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {messages.map((m) => (
            <MessageItem key={m.messageId} message={m} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageItem({ message }: { message: DemoMessage }) {
  const { t } = useTranslation();
  
  return (
    <div className="rounded-lg border border-primary/20 bg-card p-3 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-primary/90">
          {message.from === "self" || message.from === "me" ? "self" : message.from}
          {message.optimistic && (
            <span className="ml-2 text-xs text-primary/60">
              ({t("queued", "Queued")})
            </span>
          )}
        </div>
        <div className="text-xs text-primary/60">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      <div className="text-sm whitespace-pre-wrap break-words text-primary/70">
        {message.body}
      </div>
    </div>
  );
}

export default Inbox;
