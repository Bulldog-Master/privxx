/**
 * ThreadView Component
 * 
 * Renders full conversation history using POST /message/thread.
 * Acks available messages when thread is opened (delivery bookkeeping only).
 * Shows encrypted message placeholders in Phase-1.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, RefreshCw, MessageSquare, CheckCheck } from "lucide-react";
import { bridgeClient } from "@/api/bridge";
import type { MessageItem } from "@/api/bridge/messageTypes";
import { cn } from "@/lib/utils";

interface ThreadViewProps {
  conversationId: string;
  /** Callback when messages are acked (to update undelivered count in list) */
  onMessagesAcked?: (conversationId: string) => void;
  className?: string;
}

export function ThreadView({ conversationId, onMessagesAcked, className }: ThreadViewProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [ackInProgress, setAckInProgress] = useState(false);
  
  // Track which conversation we've already acked to avoid duplicate acks
  const ackedConvRef = useRef<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // BridgeClient handles session issuance internally
      const response = await bridgeClient.fetchThread({
        conversationId,
        limit: 50,
      });
      
      const items = response.items ?? [];
      setMessages(items);
      setServerTime(response.serverTime);
      
      // After loading, ack all available messages (if we haven't already for this conversation)
      if (ackedConvRef.current !== conversationId) {
        const availableItems = items.filter((m) => m.state === "available");
        if (availableItems.length > 0) {
          await ackAvailableMessages(availableItems);
        }
        ackedConvRef.current = conversationId;
      }
    } catch (err) {
      console.error("[ThreadView] Failed to load thread:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /**
   * Ack all available messages (delivery bookkeeping)
   * This transitions them from "available" to "consumed"
   */
  const ackAvailableMessages = async (availableItems: MessageItem[]) => {
    if (availableItems.length === 0) return;
    
    setAckInProgress(true);
    
    try {
      const fingerprints = availableItems.map((m) => m.envelopeFingerprint);
      
      const result = await bridgeClient.ackMessages({
        conversationId,
        envelopeFingerprints: fingerprints,
      });
      
      console.debug("[ThreadView] Acked messages:", result.acked);
      
      // Update local state to show consumed
      setMessages((prev) =>
        prev.map((m) =>
          fingerprints.includes(m.envelopeFingerprint)
            ? { ...m, state: "consumed" as const }
            : m
        )
      );
      
      // Notify parent to update undelivered count
      if (onMessagesAcked) {
        onMessagesAcked(conversationId);
      }
    } catch (err) {
      // Ack failure is non-critical - log but don't show error
      console.warn("[ThreadView] Failed to ack messages:", err);
    } finally {
      setAckInProgress(false);
    }
  };

  useEffect(() => {
    // Reset acked ref when conversation changes
    if (conversationId !== ackedConvRef.current) {
      ackedConvRef.current = null;
    }
    loadThread();
  }, [loadThread, conversationId]);

  // Format Unix timestamp to readable time
  const formatTime = (unixSeconds: number): string => {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (unixSeconds: number): string => {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={cn("m-4", className)}>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadThread}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("common.retry", "Retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center text-muted-foreground", className)}>
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p>{t("messages.emptyThread", "No messages in this conversation")}</p>
        {serverTime && (
          <p className="text-xs mt-2 opacity-70">
            {t("messages.serverTime", "Server time")}: {serverTime}
          </p>
        )}
      </div>
    );
  }

  // Messages are newest-first from API, reverse for chronological display
  const chronologicalMessages = [...messages].reverse();

  return (
    <ScrollArea className={cn("h-[400px]", className)}>
      <div className="space-y-4 p-4">
        {/* Ack indicator */}
        {ackInProgress && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
            <CheckCheck className="h-3 w-3 animate-pulse" />
            {t("messages.markingDelivered", "Marking as delivered...")}
          </div>
        )}
        
        {chronologicalMessages.map((msg) => (
          <div
            key={msg.envelopeFingerprint}
            className={cn(
              "flex flex-col gap-1 p-3 rounded-lg max-w-[85%]",
              msg.state === "consumed" 
                ? "bg-muted/50 opacity-75" 
                : "bg-primary/10 border border-primary/20"
            )}
          >
            {/* Encrypted message placeholder */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span className="font-mono text-xs truncate">
                {t("messages.encryptedPlaceholder", "Encrypted message (Phase-1)")}
              </span>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span className="font-mono opacity-70">
                {msg.envelopeFingerprint.slice(0, 12)}…
              </span>
              <div className="flex items-center gap-2">
                <span>{formatDate(msg.createdAtUnix)}</span>
                <span>{formatTime(msg.createdAtUnix)}</span>
                {/* Phase-1 honest wording: "Delivered" not "Read" */}
                {msg.state === "consumed" && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" />
                    {t("messages.delivered", "Delivered")}
                  </span>
                )}
                {msg.state === "available" && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    {t("messages.new", "New")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
