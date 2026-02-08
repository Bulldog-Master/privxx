/**
 * ComposeTab — standalone compose view with conversation picker.
 * Allows selecting an existing conversation then composing a message.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { Compose } from "../Compose";
import { useConversationList } from "../hooks/useConversationList";
import { useIdentity } from "@/features/identity";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ComposeTab() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  const { conversations, getNickname } = useConversationList();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
        <MessageSquare className="h-5 w-5 text-primary/60 mb-2" />
        <p className="text-xs text-primary/60">
          {t("composeLockedHint", "Unlock identity to send messages")}
        </p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {t("composeNoConversations", "No conversations yet. Receive a message first to start composing.")}
      </div>
    );
  }

  if (!selectedId) {
    return (
      <div className="p-3 space-y-2">
        <p className="text-xs text-muted-foreground px-1">
          {t("composePickConversation", "Select a conversation to compose:")}
        </p>
        <ScrollArea className="max-h-60">
          <div className="space-y-1">
            {conversations.map((conv) => {
              const nick = getNickname(conv.conversationId);
              return (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedId(conv.conversationId)}
                  className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm font-medium truncate">
                    {nick || conv.conversationId.slice(0, 16) + "…"}
                  </div>
                  {nick && (
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {conv.conversationId.slice(0, 16)}…
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const nick = getNickname(selectedId);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setSelectedId(null)}
        className="text-sm text-primary/70 hover:text-primary p-2 text-left"
      >
        ← {t("backToList", "Back")}
      </button>
      <div className="px-3 pb-1 text-xs text-muted-foreground truncate">
        {t("composingTo", "To:")} {nick || selectedId.slice(0, 20) + "…"}
      </div>
      <Compose
        conversationId={selectedId}
        onOptimistic={() => {}}
        onOptimisticRemove={() => {}}
      />
    </div>
  );
}
