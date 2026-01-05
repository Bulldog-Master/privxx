import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Inbox } from "./Inbox";
import { Compose } from "./Compose";
import { useInbox } from "./useInbox";
import { useIdentity } from "@/features/identity";
import { PaymentsPanel } from "@/features/payments";
import { BrowserPanel } from "@/features/browser";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { Clock } from "lucide-react";

function TransportOfflineNotice() {
  const { t } = useTranslation();
  const { healthData } = useBridgeHealthStatus();

  return (
    <div className="p-6 text-center space-y-3">
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Clock className="h-6 w-6 text-amber-500" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {t("transportOffline.title", "Transport Offline")}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
        {t(
          "transportOffline.description",
          "The privacy network is initializing. Messaging and browsing will be available once the backend connects to xxDK."
        )}
      </p>
      {healthData?.version && (
        <p className="text-xs text-muted-foreground/60 font-mono">
          Bridge v{healthData.version} • xxdkReady: false
        </p>
      )}
    </div>
  );
}

export function MessagesPanel() {
  const { t } = useTranslation();
  const { isUnlocked, isOffline } = useIdentity();
  const { isSimulated } = useBridgeHealthStatus();
  const { 
    messages, 
    isLoading, 
    error, 
    refresh, 
    addOptimistic, 
    removeOptimistic 
  } = useInbox();

  // Gate entire panel when xxdkReady=false (transport offline)
  if (isSimulated) {
    return (
      <div role="region" aria-label={t("messagingPanel", "Messaging panel")}>
        <TransportOfflineNotice />
      </div>
    );
  }

  // Tabs are muted when bridge is offline
  const tabsMuted = isOffline;

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
