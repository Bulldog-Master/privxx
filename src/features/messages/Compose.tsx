import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bridgeClient } from "@/api/bridge";
import { toast } from "sonner";
import { useIdentity } from "@/features/identity";
import type { DemoMessage } from "./types";

interface ComposeProps {
  onOptimistic: (message: DemoMessage) => void;
  onOptimisticRemove: (messageId: string) => void;
}

export function Compose({ onOptimistic, onOptimisticRemove }: ComposeProps) {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  
  const [recipient, setRecipient] = useState("self");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when unlocked
  useEffect(() => {
    if (isUnlocked && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isUnlocked]);

  const canSend = useMemo(() => {
    return isUnlocked && !isSending && recipient.trim().length > 0 && body.trim().length > 0;
  }, [isUnlocked, isSending, recipient, body]);

  const handleSend = async () => {
    if (!canSend) return;
    setError(undefined);
    setIsSending(true);

    // Create optimistic message
    const optimisticId = `optimistic-${crypto.randomUUID?.() ?? String(Date.now())}`;
    const optimistic: DemoMessage = {
      messageId: optimisticId,
      from: "self",
      body: body.trim(),
      timestamp: Date.now(),
      optimistic: true,
    };

    // Insert optimistic message immediately
    onOptimistic(optimistic);

    try {
      await bridgeClient.sendMessage(recipient.trim(), body.trim());
      setBody("");
      toast.success(t("messageSent", "Message sent"));
      // Optimistic message stays until real message arrives via polling
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Send failed";
      setError(msg);
      toast.error(t("messageSendFailed", "Failed to send message"));
      // Remove optimistic message on failure
      onOptimisticRemove(optimisticId);
    } finally {
      setIsSending(false);
    }
  };

  // Locked state hint
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border-t border-primary/20 opacity-60">
        <Send className="h-5 w-5 text-primary/60 mb-2" />
        <p className="text-xs text-primary/60">
          {t("composeLockedHint", "Unlock identity to send messages")}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-primary/20 p-4 space-y-4">
      {/* Recipient */}
      <div className="space-y-2">
        <Label htmlFor="recipient" className="text-xs text-primary/80">
          {t("composeRecipient", "Recipient")}
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t("composeRecipientPlaceholder", "Enter recipient ID or 'self'")}
            disabled={isSending}
            className="pl-9 h-10 border-primary/40 text-primary placeholder:text-primary/50"
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-xs text-primary/80">
          {t("composeMessage", "Message")}
        </Label>
        <Textarea
          ref={textareaRef}
          id="message"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error) setError(undefined);
          }}
          placeholder={t("composeMessagePlaceholder", "Type your message...")}
          disabled={isSending}
          className="min-h-[100px] resize-none border-primary/40 text-primary placeholder:text-primary/50"
          maxLength={2000}
        />
        <div className="flex items-center justify-between text-xs text-primary/60">
          <span>{body.length}/2000</span>
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
        onClick={handleSend}
        disabled={!canSend}
        className="w-full min-h-[44px]"
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
    </div>
  );
}

export default Compose;
