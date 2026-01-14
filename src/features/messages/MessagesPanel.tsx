import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Compose } from "./Compose";
import { useIdentity } from "@/features/identity";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentsPanel } from "@/features/payments";
import { BrowserPanel } from "@/features/browser";
import { ThreadView } from "./components/ThreadView";
import { ConversationList } from "./components/ConversationList";
import { useConversationList } from "./hooks/useConversationList";

export function MessagesPanel() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isUnlocked, isOffline } = useIdentity();
  const { totalUndelivered, clearUndelivered } = useConversationList();

  // Track selected conversation for ThreadView
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Tabs are muted when bridge is offline OR user isn't signed in
  const tabsMuted = isOffline || !isAuthenticated;

  // Handle selecting a conversation from list
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  // Handle ack callback from ThreadView
  const handleMessagesAcked = (conversationId: string) => {
    clearUndelivered(conversationId);
  };

  return (
    <div role="region" aria-label={t("messagingPanel", "Messaging panel")}>
      <Tabs defaultValue="inbox" className="flex flex-col">
        <TabsList 
          className={`grid w-full grid-cols-4 transition-opacity duration-200 ${tabsMuted ? "opacity-40 pointer-events-none" : ""}`}
          aria-label={t("messagingTabs", "Messaging navigation")}
        >
          <style>{`
            [data-state="inactive"] { color: hsl(var(--foreground) / 0.85); }
            [data-state="active"] { color: hsl(var(--foreground)); font-weight: 500; }
          `}</style>
          <TabsTrigger 
            value="inbox"
            aria-label={totalUndelivered > 0 
              ? t("inboxTabWithCount", "Inbox, {{count}} messages", { count: totalUndelivered })
              : t("inboxTab", "Inbox")
            }
            disabled={tabsMuted}
            className="relative"
          >
            {t("inboxTab", "Inbox")}
            {/* Badge for undelivered count */}
            {isUnlocked && totalUndelivered > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {totalUndelivered > 99 ? "99+" : totalUndelivered}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose" disabled={tabsMuted}>
            {t("composeTab", "Compose")}
          </TabsTrigger>
          <TabsTrigger value="browser" disabled={tabsMuted}>
            {t("tabBrowser", "Browser")}
          </TabsTrigger>
          <TabsTrigger value="payments" disabled={tabsMuted}>
            {t("tabPayments", "Payments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-0">
          {selectedConversation ? (
            // Show ThreadView when a conversation is selected
            <div className="flex flex-col">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="text-sm text-primary/70 hover:text-primary p-2 text-left"
              >
                ← {t("backToInbox", "Back to inbox")}
              </button>
              <ThreadView 
                conversationId={selectedConversation}
                onMessagesAcked={handleMessagesAcked}
                className="flex-1"
              />
              {/* Compose within thread context */}
              <Compose 
                conversationId={selectedConversation}
                onOptimistic={() => {}}
                onOptimisticRemove={() => {}}
              />
            </div>
          ) : (
            // Show conversation list
            <ConversationList onSelectConversation={handleSelectConversation} />
          )}
        </TabsContent>

        <TabsContent value="compose" className="mt-0">
          {/* Compose tab requires selecting a conversation first in Phase-1 */}
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("composeSelectConversation", "Select a conversation from the Inbox to send a message.")}
          </div>
        </TabsContent>

        <TabsContent value="browser" className="mt-0">
          <BrowserPanel />
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <PaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MessagesPanel;
