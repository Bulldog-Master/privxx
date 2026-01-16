package contracts

// Contract versioning
const ContractVersionV1 = 1

// Standard error codes (minimum set to satisfy current httpapi usage)
const (
	ErrInvalidInput  = "INVALID_INPUT"
	ErrInvalidIntent = "INVALID_INTENT"
	ErrInternal      = "INTERNAL"
)

// Ptr is a tiny helper to take addresses of string literals safely.
func Ptr(s string) *string { return &s }

// ErrorResponse is the canonical error payload returned by backend endpoints.
type ErrorResponse struct {
	Code    string  `json:"code,omitempty"`
	Message *string `json:"message,omitempty"`
}

// ----- Intents (requests) -----

type ConnectIntent struct {
	V         int    `json:"v"`
	UserID    string `json:"userId,omitempty"`
	Domain    string `json:"domain,omitempty"`
	RequestID string `json:"requestId,omitempty"`
}

type OpenConversationIntent struct {
	V               int    `json:"v"`
	UserID          string `json:"userId,omitempty"`
	ConversationID  string `json:"conversationId,omitempty"`
	ParticipantHint string `json:"participantHint,omitempty"`
	RequestID       string `json:"requestId,omitempty"`
}

// ----- Results (responses) -----

type ConnectResult struct {
	V         int            `json:"v"`
	RequestID string         `json:"requestId,omitempty"`
	Ok        bool           `json:"ok"`
	Error     *ErrorResponse `json:"error,omitempty"`
}

type OpenConversationResult struct {
	V              int            `json:"v"`
	RequestID      string         `json:"requestId,omitempty"`
	ConversationID string         `json:"conversationId,omitempty"`
	Ok             bool           `json:"ok"`
	Error          *ErrorResponse `json:"error,omitempty"`
}

// ----- Messaging -----

type SendMessageIntent struct {
	V              int    `json:"v"`
	UserID         string `json:"userId,omitempty"`
	ConversationID string `json:"conversationId,omitempty"`
	Payload        string `json:"payload,omitempty"`
	RequestID      string `json:"requestId,omitempty"`
}

type SendMessageResult struct {
	V         int            `json:"v"`
	RequestID string         `json:"requestId,omitempty"`
	Ok        bool           `json:"ok"`
	Accepted  bool           `json:"accepted,omitempty"`
	Error     *ErrorResponse `json:"error,omitempty"`
}
