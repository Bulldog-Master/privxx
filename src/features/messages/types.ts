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
