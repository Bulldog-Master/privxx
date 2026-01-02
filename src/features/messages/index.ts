/**
 * Messages Feature Module
 * 
 * Centralized exports for messaging functionality.
 */

export { MessagesPanel } from "./MessagesPanel";
export { Inbox } from "./Inbox";
export { Compose } from "./Compose";
export { useInbox } from "./useInbox";
export { mergeMessages } from "./merge";
export { ContactPicker } from "./components/ContactPicker";
export { QRCodeDialog } from "./components/QRCodeDialog";
export { useContacts } from "./hooks/useContacts";
export type { DemoMessage, InboxState, Contact } from "./types";
export { isValidCmixxId, getCmixxIdError } from "./types";
