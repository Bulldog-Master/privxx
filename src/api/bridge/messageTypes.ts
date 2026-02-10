/**
 * Privxx Bridge Messaging API Types (Phase-1 Contract)
 * 
 * ARCHITECTURE:
 * - POST /conversation/create = create/get conversation (idempotent)
 * - POST /session/issue = obtain sessionId for messaging operations
 * - POST /message/inbox = queue view (available-only)
 * - POST /message/thread = history view (includes consumed by default)
 * - POST /message/send = queue outbound message
 * - POST /message/ack = delivery bookkeeping
 * 
 * KEY CONCEPTS:
 * - "consumed" is NOT a read receipt — it's internal delivery bookkeeping only
 * - There are NO presence, typing, or read indicators
 * - payloadCiphertextB64 is OPAQUE in Phase-1 (no client-side decryption)
 * - conversationId is bridge-assigned (do not derive client-side)
 * - Items are returned newest-first
 * - sessionId must be issued via /session/issue (not hardcoded)
 * - Sessions are short-lived (~15 min); re-issue on invalid_session
 */

// =============================================================================
// CONVERSATION CREATE (POST /conversation/create)
// =============================================================================

/**
 * POST /conversation/create — Request body
 * 
 * Idempotent: returns existing conversation if one already exists for the peer.
 */
export interface CreateConversationRequest {
  /** Stable peer fingerprint string */
  peerFingerprint: string;
  /** Optional opaque base64 peer reference */
  peerRefEncryptedB64?: string;
}

/**
 * POST /conversation/create — Response
 */
export interface CreateConversationResponse {
  /** Bridge-assigned conversation ID */
  conversationId: string;
  /** Server time (ISO 8601) */
  serverTime: string;
}

// =============================================================================
// SESSION ISSUANCE (POST /session/issue)
// =============================================================================

export type SessionPurpose = "message_receive" | "message_send";

/**
 * POST /session/issue — Request body
 * 
 * @example For inbox: { purpose: "message_receive" }
 * @example For thread: { purpose: "message_receive", conversationId: "conv_123" }
 * @example For send: { purpose: "message_send", conversationId: "conv_123" }
 */
export interface IssueSessionRequest {
  /** Purpose of the session */
  purpose: SessionPurpose;
  /** Conversation ID (omit for inbox, required for thread/send) */
  conversationId?: string;
}

/**
 * POST /session/issue — Response
 */
export interface IssueSessionResponse {
  /** Issued session ID to use in subsequent calls */
  sessionId: string;
  /** Echoed purpose */
  purpose?: SessionPurpose;
  /** Server time (ISO 8601) */
  serverTime?: string;
}

// =============================================================================
// MESSAGE ITEM (shared response shape)
// =============================================================================

export type MessageState = "available" | "consumed";

/**
 * MessageItem — canonical message shape from bridge
 * 
 * @example
 * {
 *   "conversationId": "conv_test_1",
 *   "payloadCiphertextB64": "...",
 *   "envelopeFingerprint": "fp_123",
 *   "createdAtUnix": 1768398733,
 *   "expiresAtUnix": 1770990733,
 *   "state": "consumed"
 * }
 */
export interface MessageItem {
  /** Thread identifier (opaque, bridge-assigned) */
  conversationId: string;
  /** Encrypted payload (Base64) — treat as opaque in Phase-1 */
  payloadCiphertextB64: string;
  /** Unique fingerprint for this envelope */
  envelopeFingerprint: string;
  /** Unix timestamp (seconds) when message was created */
  createdAtUnix: number;
  /** Unix timestamp (seconds) when message expires */
  expiresAtUnix: number;
  /** Delivery state — "available" or "consumed" */
  state: MessageState;
}

// =============================================================================
// INBOX ENDPOINT (POST /message/inbox)
// =============================================================================

/**
 * POST /message/inbox — Request body (internal use)
 */
export interface InboxRequest {
  /** Session identifier (from /session/issue) */
  sessionId: string;
  /** Max items to return (default: 10) */
  limit?: number;
}

/**
 * POST /message/inbox — Response
 */
export interface InboxResponse {
  /** Available messages (null if none) */
  items: MessageItem[] | null;
  /** Server time (ISO 8601) */
  serverTime: string;
}

// =============================================================================
// THREAD ENDPOINT (POST /message/thread)
// =============================================================================

/**
 * POST /message/thread — Request body (internal use)
 */
export interface ThreadRequest {
  /** Session identifier (from /session/issue) */
  sessionId: string;
  /** Conversation identifier */
  conversationId: string;
  /** Max items to return (default: 10) */
  limit?: number;
  /** Include consumed messages (default: true) */
  includeConsumed?: boolean;
}

/**
 * POST /message/thread — Response
 */
export interface ThreadResponse {
  /** Thread messages (null if empty) */
  items: MessageItem[] | null;
  /** Server time (ISO 8601) */
  serverTime: string;
}

// =============================================================================
// SEND ENDPOINT (POST /message/send)
// =============================================================================

/**
 * POST /message/send — Request body (internal use)
 */
export interface SendMessageRequest {
  /** Session identifier (from /session/issue with purpose: "message_send") */
  sessionId: string;
  /** Conversation ID (MUST be provided — bridge-assigned, not derived) */
  conversationId: string;
  /** Plaintext message Base64-encoded (Phase-1 test mode; transport mocked server-side) */
  plaintextB64: string;
}

/**
 * POST /message/send — Response
 */
export interface SendMessageResponse {
  /** Status string from bridge */
  status: "Sent" | "queued";
  /** Server time (ISO 8601) */
  serverTime?: string;
}

// =============================================================================
// ACK ENDPOINT (POST /message/ack)
// =============================================================================

/**
 * POST /message/ack — Request body
 * 
 * Marks messages as consumed (delivery bookkeeping only — NOT read receipts).
 * Must use a session issued with purpose: "message_receive" and matching conversationId.
 */
export interface AckRequest {
  /** Session identifier (from /session/issue with purpose: "message_receive") */
  sessionId: string;
  /** Conversation identifier (must match session scope) */
  conversationId: string;
  /** Array of envelope fingerprints to mark as consumed */
  envelopeFingerprints: string[];
}

/**
 * POST /message/ack — Response
 */
export interface AckResponse {
  /** Status string */
  status?: "ok";
  /** Number of fingerprints successfully transitioned to consumed */
  acked: number;
  /** Server time (ISO 8601) */
  serverTime?: string;
}
