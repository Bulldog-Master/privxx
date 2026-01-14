/**
 * ConversationList Component (Phase-1)
 * 
 * Displays list of conversations with:
 * - Undelivered badge (New/Undelivered — NOT "Unread")
 * - Lazy preview fetching via intersection observer
 * - Sorted: undelivered first, then by recency
 * - Nickname support with edit dialog
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, MessageSquare, Lock, AlertCircle, Mail, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConversationList } from "../hooks/useConversationList";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentity } from "@/features/identity";
import type { ConvMeta } from "../conversationTypes";
import { Link } from "react-router-dom";
import { NicknameDialog } from "./NicknameDialog";

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
    getNickname,
    setNickname,
    clearNickname,
  } = useConversationList();

  // Nickname dialog state
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);

  // Close dialog and reset editing state to prevent stale actions
  const closeNicknameDialog = useCallback(() => {
    setNicknameDialogOpen(false);
    setEditingConversationId(null);
  }, []);

  const handleEditNickname = useCallback((conversationId: string) => {
    setEditingConversationId(conversationId);
    setNicknameDialogOpen(true);
  }, []);

  const handleSaveNickname = useCallback((nickname: string) => {
    if (!editingConversationId) return;
    setNickname(editingConversationId, nickname);
  }, [editingConversationId, setNickname]);

  const handleClearNickname = useCallback(() => {
    if (!editingConversationId) return;
    clearNickname(editingConversationId);
  }, [editingConversationId, clearNickname]);

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
              nickname={getNickname(conv.conversationId)}
              onSelect={onSelectConversation}
              onVisible={fetchPreview}
              onEditNickname={handleEditNickname}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Nickname edit dialog */}
      <NicknameDialog
        open={nicknameDialogOpen}
        onOpenChange={(open) => (open ? setNicknameDialogOpen(true) : closeNicknameDialog())}
        conversationId={editingConversationId ?? ""}
        currentNickname={editingConversationId ? getNickname(editingConversationId) : undefined}
        onSave={handleSaveNickname}
        onClear={handleClearNickname}
      />
    </div>
  );
}

/**
 * Single conversation row with lazy preview loading
 */
function ConversationRow({
  conversation,
  nickname,
  onSelect,
  onVisible,
  onEditNickname,
}: {
  conversation: ConvMeta;
  nickname?: string;
  onSelect: (id: string) => void;
  onVisible: (id: string) => void;
  onEditNickname: (id: string) => void;
}) {
  const { t } = useTranslation();
  const rowRef = useRef<HTMLDivElement>(null);
  
  // Stable ref to avoid observer churn when parent re-renders
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  // Intersection observer for lazy preview fetching (stable deps)
  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisibleRef.current(conversation.conversationId);
          observer.unobserve(element); // ✅ stop after first intersect
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [conversation.conversationId]); // ✅ no onVisible dep - uses ref

  // Also fetch preview if undelivered
  useEffect(() => {
    if (conversation.undeliveredCount > 0) {
      onVisibleRef.current(conversation.conversationId);
    }
  }, [conversation.undeliveredCount, conversation.conversationId]);

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
    <div
      ref={rowRef}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors group",
        "hover:bg-primary/5 focus-within:bg-primary/10",
        conversation.undeliveredCount > 0 && "bg-primary/5 border border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: Icon + ID (clickable area) */}
        <button
          onClick={() => onSelect(conversation.conversationId)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left focus:outline-none"
        >
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
              {nickname || conversation.conversationId}
            </p>
            {nickname && (
              <p className="text-xs text-muted-foreground/60 truncate font-mono">
                {conversation.conversationId.slice(0, 12)}…
              </p>
            )}
            {/* Preview placeholder */}
            <p className="text-xs text-muted-foreground truncate">
              {t("messages.encryptedPlaceholder", "Encrypted message (Phase-1)")}
            </p>
          </div>
        </button>

        {/* Right: Time + Badge + Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="flex flex-col items-end gap-1">
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
          
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  onEditNickname(conversation.conversationId);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {nickname 
                  ? t("nickname.edit", "Edit Nickname")
                  : t("nickname.set", "Set Nickname")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
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
