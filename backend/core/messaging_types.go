package main

import "time"

/*
Phase-5 Messaging Schemas
Backend-only, stub-safe
*/

// ---------- Common ----------

type MessageID string
type ConversationID string

type Message struct {
	ID             MessageID      `json:"id"`
	ConversationID ConversationID `json:"conversationId"`
	Sender         string         `json:"sender"`
	Body           string         `json:"body"`
	Timestamp      time.Time      `json:"timestamp"`
	Consumed       bool           `json:"consumed"`
}

// ---------- Send ----------

type MessageSendReq struct {
	V         int    `json:"v"`
	Type      string `json:"type"` // message_send
	RequestID string `json:"requestId"`
	Message   string `json:"message"`
}

type MessageSendAck struct {
	V         int       `json:"v"`
	Type      string    `json:"type"` // message_send_ack
	RequestID string    `json:"requestId"`
	Ok        bool      `json:"ok"`
	MessageID MessageID `json:"messageId,omitempty"`
}

// ---------- Inbox ----------

type MessageInboxResp struct {
	V         int       `json:"v"`
	Type      string    `json:"type"` // message_inbox
	RequestID string    `json:"requestId"`
	Ok        bool      `json:"ok"`
	Messages  []Message `json:"messages"`
}

// ---------- Thread ----------

type MessageThreadResp struct {
	V              int            `json:"v"`
	Type           string         `json:"type"` // message_thread
	RequestID      string         `json:"requestId"`
	Ok             bool           `json:"ok"`
	ConversationID ConversationID `json:"conversationId"`
	Messages       []Message      `json:"messages"`
}
