import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageInbox } from "./MessageInbox";
import { ComposeForm } from "./ComposeForm";
import { useMessages } from "@/hooks/useMessages";
import { useIdentity } from "@/contexts/IdentityContext";
import type { Message } from "@/api/bridge";

export function MessagingPanel() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  const { messages, isLoading, error, refetch, addOptimistic } = useMessages({
    enabled: isUnlocked,
    pollIntervalMs: 5000,
  });

  const handleMessageSent = (message: Message) => {
    addOptimistic(message);
  };

  return (
    <Card className="w-full max-w-md bg-card/50 border-border/50 backdrop-blur-sm">
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-muted/30">
          <TabsTrigger value="inbox" className="text-sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("inboxTab", "Inbox")}
            {messages.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                {messages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="compose" className="text-sm">
            {t("composeTab", "Compose")}
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-0 min-h-[300px]">
          <TabsContent value="inbox" className="m-0">
            <MessageInbox
              messages={messages}
              isLoading={isLoading}
              error={error}
              onRefresh={refetch}
              isUnlocked={isUnlocked}
            />
          </TabsContent>

          <TabsContent value="compose" className="m-0">
            <ComposeForm
              isUnlocked={isUnlocked}
              onMessageSent={handleMessageSent}
              defaultRecipient="self"
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
