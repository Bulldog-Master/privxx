package contracts

import "time"

// MessageV1 is a minimal message record for inbox responses.
// (Phase 7B: in-memory only; Phase 8 will move payloads to storage.)
type MessageV1 struct {
	ID         string    `json:"id"`
	From       string    `json:"from"`
	Payload    string    `json:"payload"`
	ReceivedAt time.Time `json:"receivedAt"`
}

// InboxIntent requests messages for a conversation.
// Limit is optional; backend will clamp it to a safe maximum.
type InboxIntent struct {
	V              int    `json:"v"`
	UserID         string `json:"userId"`
	ConversationID string `json:"conversationId"`
	SinceID        string `json:"sinceId,omitempty"`
	Limit          int    `json:"limit,omitempty"`
}

type InboxResult struct {
	Messages []MessageV1 `json:"messages"`
	Error    *string    `json:"error,omitempty"`
	Code     *string    `json:"code,omitempty"`
	Message  *string    `json:"message,omitempty"`
}
