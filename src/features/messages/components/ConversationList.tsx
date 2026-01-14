/**
 * ConversationList Component (Phase-1)
 * 
 * Displays list of conversations with:
 * - Undelivered badge (New/Undelivered — NOT "Unread")
 * - Lazy preview fetching via intersection observer
 * - Sorted: undelivered first, then by recency
 */

import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, MessageSquare, Lock, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConversationList } from "../hooks/useConversationList";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentity } from "@/features/identity";
import type { ConvMeta } from "../conversationTypes";
import { Link } from "react-router-dom";

interface ConversationListProps {
  /** Called when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  className?: string;
}

export function ConversationList({ onSelectConversation, className }: ConversationListProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, isInitialized: authInitialized } = useAuth();
  const { isUnlocked, isInitialized: identityInitialized, isLoading: identityLoading, isSettling } = useIdentity();
  
  const {
    conversations,
    isLoading,
    error,
    refreshInbox,
    fetchPreview,
    totalUndelivered,
  } = useConversationList();

  // Show skeleton during initialization
  if (!identityInitialized || identityLoading || isSettling) {
    return <ConversationListSkeleton />;
  }

  // Locked state
  if (!isUnlocked) {
    if (authLoading || !authInitialized) {
      return <ConversationListSkeleton />;
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
            ? t("inboxLockedBody", "Unlock your identity above to view messages")
            : t("authRequiredBody", "Sign in to unlock your identity and view messages")}
        </p>
        {!isAuthenticated && (
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">{t("common.signIn", "Sign In")}</Link>
          </Button>
        )}
      </div>
    );
  }

  // Initial loading
  if (isLoading && conversations.length === 0) {
    return <ConversationListSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center px-4">
        <AlertCircle className="h-6 w-6 text-destructive mb-2" />
        <h3 className="text-sm font-semibold mb-1">
          {t("conversationListError", "Unable to load conversations")}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={refreshInbox}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("retry", "Retry")}
        </Button>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <MessageSquare className="h-6 w-6 text-primary/60 mb-2" />
        <h3 className="text-sm font-semibold mb-1 text-primary/90">
          {t("noConversations", "No conversations yet")}
        </h3>
        <p className="text-xs text-primary/60">
          {t("noConversationsHint", "Messages will appear here when you receive them")}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20">
        <h3 className="text-sm font-medium text-primary/90">
          {t("conversationsTitle", "Conversations")}
          {totalUndelivered > 0 && (
            <Badge variant="default" className="ml-2 text-xs">
              {totalUndelivered} {t("new", "new")}
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshInbox}
          className="h-8 w-8"
          aria-label={t("refreshConversations", "Refresh conversations")}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <ConversationRow
              key={conv.conversationId}
              conversation={conv}
              onSelect={onSelectConversation}
              onVisible={fetchPreview}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Single conversation row with lazy preview loading
 */
function ConversationRow({
  conversation,
  onSelect,
  onVisible,
}: {
  conversation: ConvMeta;
  onSelect: (id: string) => void;
  onVisible: (id: string) => void;
}) {
  const { t } = useTranslation();
  const rowRef = useRef<HTMLButtonElement>(null);

  // Intersection observer for lazy preview fetching
  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible(conversation.conversationId);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [conversation.conversationId, onVisible]);

  // Also fetch preview if undelivered
  useEffect(() => {
    if (conversation.undeliveredCount > 0) {
      onVisible(conversation.conversationId);
    }
  }, [conversation.undeliveredCount, conversation.conversationId, onVisible]);

  const formatTime = (unixSeconds?: number): string => {
    if (!unixSeconds) return "";
    const date = new Date(unixSeconds * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <button
      ref={rowRef}
      onClick={() => onSelect(conversation.conversationId)}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        "hover:bg-primary/5 focus:bg-primary/10 focus:outline-none",
        conversation.undeliveredCount > 0 && "bg-primary/5 border border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: Icon + ID */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            conversation.undeliveredCount > 0 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(
              "text-sm truncate",
              conversation.undeliveredCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {conversation.conversationId}
            </p>
            {/* Preview placeholder */}
            <p className="text-xs text-muted-foreground truncate">
              {t("messages.encryptedPlaceholder", "Encrypted message (Phase-1)")}
            </p>
          </div>
        </div>

        {/* Right: Time + Badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {conversation.lastSeenAtUnix && (
            <span className="text-xs text-muted-foreground">
              {formatTime(conversation.lastSeenAtUnix)}
            </span>
          )}
          {conversation.undeliveredCount > 0 && (
            <Badge 
              variant="default" 
              className="text-xs min-w-[1.5rem] justify-center"
            >
              {conversation.undeliveredCount > 99 ? "99+" : conversation.undeliveredCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export default ConversationList;
