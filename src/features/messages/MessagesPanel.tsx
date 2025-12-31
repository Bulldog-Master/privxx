import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Inbox } from "./Inbox";
import { Compose } from "./Compose";
import { useInbox } from "./useInbox";
import { useIdentity } from "@/features/identity";
import { PaymentsPanel } from "@/features/payments";
import { BrowserPanel } from "@/features/browser";

export function MessagesPanel() {
  const { t } = useTranslation();
  const { isUnlocked, isNone, isOffline } = useIdentity();
  const { 
    messages, 
    isLoading, 
    error, 
    refresh, 
    addOptimistic, 
    removeOptimistic 
  } = useInbox();

  // Tabs are muted when no identity exists or bridge is offline
  const tabsMuted = isNone || isOffline;

  return (
    <div role="region" aria-label={t("messagingPanel", "Messaging panel")}>
      <Tabs defaultValue="inbox" className="flex flex-col">
        <TabsList 
          className={`grid w-full grid-cols-4 transition-opacity duration-200 ${tabsMuted ? "opacity-40 pointer-events-none" : ""}`}
          aria-label={t("messagingTabs", "Messaging navigation")}
        >
          <TabsTrigger 
            value="inbox"
            aria-label={messages.length > 0 
              ? t("inboxTabWithCount", "Inbox, {{count}} messages", { count: messages.length })
              : t("inboxTab", "Inbox")
            }
            disabled={tabsMuted}
          >
            {t("inboxTab", "Inbox")}
            {messages.length > 0 && !tabsMuted && (
              <span className="ml-1.5 text-xs text-primary/60" aria-hidden="true">
                ({messages.length})
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
          <Inbox
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
            isUnlocked={isUnlocked}
          />
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
