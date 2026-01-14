import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Inbox } from "./Inbox";
import { Compose } from "./Compose";
import { useInbox } from "./useInbox";
import { useIdentity } from "@/features/identity";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentsPanel } from "@/features/payments";
import { BrowserPanel } from "@/features/browser";
import { ThreadView } from "./components/ThreadView";
import { InboxBadge } from "./components/InboxBadge";

export function MessagesPanel() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isUnlocked, isOffline } = useIdentity();
  const {
    messages,
    isLoading,
    isWarmingUp,
    error,
    refresh,
    addOptimistic,
    removeOptimistic
  } = useInbox();

  // Track selected conversation for ThreadView
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Tabs are muted when bridge is offline OR user isn't signed in
  const tabsMuted = isOffline || !isAuthenticated;

  // Handle selecting a conversation from inbox
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
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
            aria-label={messages.length > 0 
              ? t("inboxTabWithCount", "Inbox, {{count}} messages", { count: messages.length })
              : t("inboxTab", "Inbox")
            }
            disabled={tabsMuted}
            className="relative"
          >
            {t("inboxTab", "Inbox")}
            {/* Phase-1 InboxBadge for available message count */}
            <InboxBadge 
              enabled={isUnlocked && !tabsMuted} 
              pollInterval={30000}
              className="ml-1.5"
            />
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
                className="flex-1"
              />
            </div>
          ) : (
            // Show inbox list
            <Inbox
              messages={messages}
              isLoading={isLoading}
              isWarmingUp={isWarmingUp}
              error={error}
              onRefresh={refresh}
              isUnlocked={isUnlocked}
              onSelectConversation={handleSelectConversation}
            />
          )}
        </TabsContent>

        <TabsContent value="compose" className="mt-0">
          <Compose 
            onOptimistic={addOptimistic}
            onOptimisticRemove={removeOptimistic}
          />
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
