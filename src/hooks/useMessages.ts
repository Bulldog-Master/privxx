import { useState, useEffect, useCallback, useRef } from "react";
import { bridgeClient, type Message } from "@/api/bridge";

export interface UseMessagesOptions {
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useMessages(options: UseMessagesOptions = {}) {
  const { pollIntervalMs = 5000, enabled = true } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchMessages = useCallback(async () => {
    if (!enabled) return;
    
    try {
      const fetched = await bridgeClient.receiveMessages();
      
      // De-dupe based on message content + timestamp (since we don't have IDs from bridge)
      const newMessages: Message[] = [];
      for (const msg of fetched) {
        const msgKey = `${msg.from}:${msg.message}:${msg.timestamp}`;
        if (!seenIdsRef.current.has(msgKey)) {
          seenIdsRef.current.add(msgKey);
          newMessages.push(msg);
        }
      }
      
      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
      }
      
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch messages";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchMessages();
    }
  }, [enabled, fetchMessages]);

  // Polling
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(fetchMessages, pollIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, pollIntervalMs, fetchMessages]);

  // Optimistic add for sent messages
  const addOptimistic = useCallback((message: Message) => {
    const msgKey = `${message.from}:${message.message}:${message.timestamp}`;
    seenIdsRef.current.add(msgKey);
    setMessages((prev) => [message, ...prev]);
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    return fetchMessages();
  }, [fetchMessages]);

  const clear = useCallback(() => {
    setMessages([]);
    seenIdsRef.current.clear();
  }, []);

  return {
    messages,
    isLoading,
    error,
    refetch,
    addOptimistic,
    clear,
  };
}
