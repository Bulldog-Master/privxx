/**
 * Privxx Demo Message Types
 * 
 * Centralized type definitions for messaging feature.
 */

export type DemoMessage = {
  messageId: string;
  from: string; // "self" or sender id
  body: string;
  timestamp: number; // epoch ms
  optimistic?: boolean;
};

export type InboxState = {
  messages: DemoMessage[];
  isLoading: boolean;
  error?: string;
  lastUpdated?: number;
};

export interface Contact {
  id: string;
  name: string;
  recipientId: string;
  createdAt: number;
}

/**
 * cMixx ID validation utilities
 * Format: Base64-encoded 32-byte public key (44 characters)
 */
export const CMIXX_ID_REGEX = /^[A-Za-z0-9+/]{43}=$/;
export const CMIXX_ID_LENGTH = 44;

export function isValidCmixxId(id: string): boolean {
  if (id === "self") return true; // Special case for self-messaging
  return CMIXX_ID_REGEX.test(id);
}

export function getCmixxIdError(id: string): string | null {
  if (!id.trim()) return "recipientRequired";
  if (id === "self") return null;
  if (id.length !== CMIXX_ID_LENGTH) {
    return "recipientLengthError";
  }
  if (!CMIXX_ID_REGEX.test(id)) {
    return "recipientFormatError";
  }
  return null;
}
