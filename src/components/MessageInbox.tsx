import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { Inbox, RefreshCw, User, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/api/bridge";

interface MessageInboxProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  isUnlocked: boolean;
}

export function MessageInbox({
  messages,
  isLoading,
  error,
  onRefresh,
  isUnlocked,
}: MessageInboxProps) {
  const { t } = useTranslation();

  // Not unlocked state
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          {t("inboxLockedTitle", "Identity Locked")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          {t("inboxLockedBody", "Unlock your identity to view messages")}
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">
          {t("inboxLoading", "Loading messages...")}
        </p>
      </div>
    );
  }

  // Error state
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          {t("inboxErrorTitle", "Unable to load messages")}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("retry", "Retry")}
        </Button>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          {t("inboxEmptyTitle", "No messages yet")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          {t("inboxEmptyBody", "Messages will appear here when received")}
        </p>
      </div>
    );
  }

  // Messages list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("inboxTitle", "Messages")}</span>
          <span className="text-xs text-muted-foreground">({messages.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 max-h-[300px]">
        <div className="divide-y divide-border/30">
          {messages.map((msg, index) => (
            <MessageItem key={`${msg.timestamp}-${index}`} message={msg} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true });

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground truncate">
              {message.from}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          </div>
          <p className="text-sm text-foreground/80 break-words">{message.message}</p>
        </div>
      </div>
    </div>
  );
}
