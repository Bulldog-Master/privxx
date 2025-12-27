import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bridgeClient, type Message } from "@/api/bridge";
import { toast } from "sonner";

interface ComposeFormProps {
  isUnlocked: boolean;
  onMessageSent: (message: Message) => void;
  defaultRecipient?: string;
}

export function ComposeForm({
  isUnlocked,
  onMessageSent,
  defaultRecipient = "self",
}: ComposeFormProps) {
  const { t } = useTranslation();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when unlocked
  useEffect(() => {
    if (isUnlocked && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isUnlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      setError(t("composeEmptyError", "Message cannot be empty"));
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const msgId = await bridgeClient.sendMessage(recipient, messageText.trim());
      
      // Optimistic insert
      const optimisticMessage: Message = {
        from: "me",
        message: messageText.trim(),
        timestamp: new Date().toISOString(),
      };
      
      onMessageSent(optimisticMessage);
      setMessageText("");
      toast.success(t("messageSent", "Message sent"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      toast.error(t("messageSendFailed", "Failed to send message"));
    } finally {
      setIsSending(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
        <Send className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">
          {t("composeLockedHint", "Unlock identity to send messages")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* Recipient */}
      <div className="space-y-2">
        <Label htmlFor="recipient" className="text-xs">
          {t("composeRecipient", "Recipient")}
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t("composeRecipientPlaceholder", "Enter recipient ID or 'self'")}
            disabled={isSending}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-xs">
          {t("composeMessage", "Message")}
        </Label>
        <Textarea
          ref={textareaRef}
          id="message"
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("composeMessagePlaceholder", "Type your message...")}
          disabled={isSending}
          className="min-h-[80px] text-sm resize-none"
          maxLength={1000}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{messageText.length}/1000</span>
          {error && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Send button */}
      <Button
        type="submit"
        disabled={isSending || !messageText.trim()}
        className="w-full"
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("composeSending", "Sending...")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {t("composeSend", "Send Message")}
          </>
        )}
      </Button>
    </form>
  );
}
