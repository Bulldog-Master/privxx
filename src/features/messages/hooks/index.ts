/**
 * Messages Hooks Module
 * 
 * Centralized exports for messaging hooks.
 * Phase-1 compatible: No protocol changes, frontend-only.
 */

// Core hooks
export { useInboxPoll, type InboxPollOptions } from "./useInboxPoll";
export { useThread } from "./useThread";
export { useConversationPreviews, type PreviewData } from "./useConversationPreviews";
export { useKnownConversations } from "./useKnownConversations";

// Legacy hook (wraps the above for backward compatibility)
export { useConversationList } from "./useConversationList";

// Utility hooks
export { useVisibilityGate } from "./useVisibilityGate";
export { useTabVisibility } from "./useTabVisibility";

// Contact management
export { useContacts } from "./useContacts";
