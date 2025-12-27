import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Lock, AlertCircle, Inbox as InboxIcon, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { IdentityModal } from "@/components/IdentityModal";
import { useIdentity } from "@/contexts/IdentityContext";
import { toast } from "sonner";
import type { DemoMessage } from "./types";

interface InboxProps {
  messages: DemoMessage[];
  isLoading: boolean;
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
  error, 
  onRefresh, 
  isUnlocked 
}: InboxProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const { unlock, error: identityError, clearError, state } = useIdentity();

  const handleUnlock = async (password: string) => {
    const success = await unlock(password);
    if (success) {
      toast.success(t("identityUnlocked", "Identity unlocked"));
    }
    return success;
  };

  // Locked state
  if (!isUnlocked) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold mb-1">
            {t("inboxLockedTitle", "Identity Locked")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("inboxLockedBody", "Unlock your identity to view messages")}
          </p>
          <Button 
            onClick={() => setModalOpen(true)}
            className="min-h-[44px]"
          >
            <Unlock className="h-4 w-4 mr-2" />
            {t("unlockIdentity", "Unlock Identity")}
          </Button>
        </div>
        <IdentityModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onUnlock={handleUnlock}
          isLoading={state === "unlocking"}
          error={identityError}
          onClearError={clearError}
        />
      </>
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

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <h3 className="text-base font-semibold mb-1">
          {t("inboxErrorTitle", "Unable to load messages")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="min-h-[44px]"
        >
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
        <InboxIcon className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="text-base font-semibold mb-1">
          {t("inboxEmptyTitle", "No messages yet")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("inboxEmptyBody", "Send a message to get started")}
        </p>
      </div>
    );
  }

  // Messages list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="text-sm font-medium">
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
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">
          {message.from === "self" || message.from === "me" ? "self" : message.from}
          {message.optimistic && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({t("queued", "Queued")})
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      <div className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
        {message.body}
      </div>
    </div>
  );
}

export default Inbox;
