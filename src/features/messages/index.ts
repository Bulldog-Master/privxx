/**
 * Messages Feature Module
 * 
 * Centralized exports for messaging functionality.
 * 
 * Phase-1 Contract:
 * - POST /message/inbox = queue view (available messages only, for badge counts)
 * - POST /message/thread = history view (for rendering conversations)
 * - POST /message/send = queue outbound message
 * - POST /message/ack = delivery bookkeeping (consumed ≠ read)
 */

export { MessagesPanel } from "./MessagesPanel";
export { Inbox } from "./Inbox";
export { Compose } from "./Compose";
export { useInbox } from "./useInbox";
export { mergeMessages } from "./merge";
export { ContactPicker } from "./components/ContactPicker";
export { QRCodeDialog } from "./components/QRCodeDialog";
export { ThreadView } from "./components/ThreadView";
export { InboxBadge } from "./components/InboxBadge";
export { ConversationList } from "./components/ConversationList";
export { useConversationList } from "./hooks/useConversationList";
export { useContacts } from "./hooks/useContacts";
export type { DemoMessage, InboxState, Contact } from "./types";
export type { ConvMeta } from "./conversationTypes";
export { isValidCmixxId, getCmixxIdError } from "./types";
