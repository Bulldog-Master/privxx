/**
 * Conversation List Types (Phase-1)
 * 
 * Local state for managing conversations derived from inbox + thread endpoints.
 * Persisted per authenticated user via localStorage (privacy-compliant: no PII).
 */

/**
 * Metadata for a single conversation
 * Derived from inbox (undelivered count) and thread preview (last message info)
 */
export interface ConvMeta {
  /** Conversation ID (bridge-assigned) */
  conversationId: string;
  /** Count of available (undelivered) messages from inbox */
  undeliveredCount: number;
  /** Unix timestamp (seconds) of most recent message — for sorting */
  lastSeenAtUnix?: number;
  /** Envelope fingerprint of most recent message — for preview identity */
  lastFp?: string;
  /** State of most recent message */
  lastState?: "available" | "consumed";
  /** Last time we fetched preview for this conversation */
  previewFetchedAt?: number;
}

/**
 * Persistent storage shape (per user)
 */
export interface ConversationStorageData {
  /** Set of known conversation IDs (serialized as array) */
  knownConversationIds: string[];
  /** Timestamp of last save */
  savedAt: number;
}

/**
 * Storage key prefix for conversation data
 */
export const CONVERSATION_STORAGE_KEY_PREFIX = "privxx:conversations:";

/**
 * Get storage key for a user
 */
export function getStorageKey(userId: string): string {
  return `${CONVERSATION_STORAGE_KEY_PREFIX}${userId}`;
}

/**
 * Load known conversation IDs from localStorage
 */
export function loadKnownConversations(userId: string): Set<string> {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    
    const data: ConversationStorageData = JSON.parse(raw);
    return new Set(data.knownConversationIds);
  } catch (e) {
    console.warn("[ConversationStorage] Failed to load:", e);
    return new Set();
  }
}

/**
 * Save known conversation IDs to localStorage
 */
export function saveKnownConversations(userId: string, ids: Set<string>): void {
  try {
    const key = getStorageKey(userId);
    const data: ConversationStorageData = {
      knownConversationIds: Array.from(ids),
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("[ConversationStorage] Failed to save:", e);
  }
}

/**
 * Sort conversations for display
 * 1. Undelivered > 0 first (descending by count)
 * 2. Then by lastSeenAtUnix (descending, newest first)
 * 3. Fallback: conversationId (stable)
 */
export function sortConversations(conversations: ConvMeta[]): ConvMeta[] {
  return [...conversations].sort((a, b) => {
    // Undelivered first
    if (a.undeliveredCount > 0 && b.undeliveredCount === 0) return -1;
    if (a.undeliveredCount === 0 && b.undeliveredCount > 0) return 1;
    
    // Both have undelivered: sort by count descending
    if (a.undeliveredCount > 0 && b.undeliveredCount > 0) {
      if (a.undeliveredCount !== b.undeliveredCount) {
        return b.undeliveredCount - a.undeliveredCount;
      }
    }
    
    // Sort by lastSeenAtUnix descending
    const aTime = a.lastSeenAtUnix ?? 0;
    const bTime = b.lastSeenAtUnix ?? 0;
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    
    // Stable fallback
    return a.conversationId.localeCompare(b.conversationId);
  });
}
