/**
 * ComposeTab — standalone compose view.
 * Always shows the compose input. Defaults to "self" conversation.
 * Optionally lets user pick an existing conversation.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, ChevronDown } from "lucide-react";
import { Compose } from "../Compose";
import { useConversationList } from "../hooks/useConversationList";
import { useIdentity } from "@/features/identity";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const SELF_CONVERSATION = "self";

export function ComposeTab() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  const { conversations, getNickname } = useConversationList();
  const [selectedId, setSelectedId] = useState<string>(SELF_CONVERSATION);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const displayName = selectedId === SELF_CONVERSATION
    ? t("composeSelf", "Self (loopback)")
    : getNickname(selectedId) || selectedId.slice(0, 20) + "…";

  return (
    <div className="flex flex-col">
      {/* Recipient selector */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-xs text-muted-foreground shrink-0">
          {t("composeTo", "To:")}
        </span>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 truncate min-w-0">
              <span className="truncate">{displayName}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {/* Self option */}
                <button
                  onClick={() => { setSelectedId(SELF_CONVERSATION); setPickerOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedId === SELF_CONVERSATION ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                  }`}
                >
                  {t("composeSelf", "Self (loopback)")}
                </button>
                {/* Existing conversations */}
                {conversations.map((conv) => {
                  const nick = getNickname(conv.conversationId);
                  return (
                    <button
                      key={conv.conversationId}
                      onClick={() => { setSelectedId(conv.conversationId); setPickerOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedId === conv.conversationId ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="truncate">
                        {nick || conv.conversationId.slice(0, 16) + "…"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Compose input — always visible */}
      <Compose
        conversationId={selectedId}
        onOptimistic={() => {}}
        onOptimisticRemove={() => {}}
      />
    </div>
  );
}
