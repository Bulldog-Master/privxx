import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Inbox } from "./Inbox";
import { Compose } from "./Compose";
import { useInbox } from "./useInbox";
import { PaymentsPanel } from "@/features/payments";
import { BrowserPanel } from "@/features/browser";

export function MessagesPanel() {
  const { t } = useTranslation();
  const { 
    messages, 
    isLoading, 
    error, 
    refresh, 
    addOptimistic, 
    removeOptimistic 
  } = useInbox();

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="inbox" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox">
            {t("inboxTab", "Inbox")}
            {messages.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({messages.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose">
            {t("composeTab", "Compose")}
          </TabsTrigger>
          <TabsTrigger value="browser">
            {t("tabBrowser", "Browser")}
          </TabsTrigger>
          <TabsTrigger value="payments">
            {t("tabPayments", "Payments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="flex-1 mt-0 overflow-hidden">
          <Inbox
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
            isUnlocked={true}
          />
        </TabsContent>

        <TabsContent value="compose" className="flex-1 mt-0">
          <Compose 
            onOptimistic={addOptimistic}
            onOptimisticRemove={removeOptimistic}
          />
        </TabsContent>

        <TabsContent value="browser" className="flex-1 mt-0 overflow-auto">
          <BrowserPanel />
        </TabsContent>

        <TabsContent value="payments" className="flex-1 mt-0 overflow-auto">
          <PaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MessagesPanel;
