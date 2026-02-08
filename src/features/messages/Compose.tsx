import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bridgeClient } from "@/api/bridge";
import { toast } from "sonner";
import { useIdentity } from "@/features/identity";
import type { DemoMessage } from "./types";

interface ComposeProps {
  /** The selected conversation ID (bridge-assigned) — required for sending */
  conversationId: string;
  onOptimistic: (message: DemoMessage) => void;
  onOptimisticRemove: (messageId: string) => void;
}

export function Compose({ conversationId, onOptimistic, onOptimisticRemove }: ComposeProps) {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  
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
    return isUnlocked && !isSending && conversationId && body.trim().length > 0;
  }, [isUnlocked, isSending, conversationId, body]);

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
      // Phase-1 contract: conversationId + plaintextB64 (base64-encoded)
      await bridgeClient.sendMessage({
        conversationId,
        plaintextB64: btoa(body.trim()),
      });
      setBody("");
      toast.success(t("messageSent", "Message sent"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Send failed";
      // Detect missing messaging endpoints (404 = not wired yet)
      const is404 = msg.includes("404") || msg.includes("Not Found");
      const isNetworkFail = msg.includes("Load failed") || msg.includes("Fetch failed") || msg.includes("Network");
      if (is404 || isNetworkFail) {
        setError(t("messagingNotAvailable", "Messaging endpoints not live yet — message drafted locally"));
        toast.info(t("messagingNotAvailableToast", "Messaging not available yet. Your message has been drafted."));
      } else {
        setError(msg);
        toast.error(t("messageSendFailed", "Failed to send message"));
      }
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
    <div className="border-t border-primary/20 p-4 space-y-3">
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
          className="min-h-[80px] resize-none border-primary/40 text-primary placeholder:text-primary/50"
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