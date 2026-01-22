package sessions

// Purpose defines the single allowed capability of a session.
type Purpose string

const (
	PurposeMessageSend    Purpose = "message_send"
	PurposeMessageReceive Purpose = "message_receive"
)

// Session is a short-lived, purpose-scoped authorization window.
// Sessions are always bound to an auth_subject (jwt.sub).
type Session struct {
	SessionID      string  `json:"session_id"`
	AuthSubject    string  `json:"auth_subject"`              // jwt.sub (mandatory binding)
	Purpose        Purpose `json:"purpose"`                   // exactly one purpose
	ConversationID *string `json:"conversation_id,omitempty"` // nil = inbox-scoped receive
	ExpiresAtUnix  int64   `json:"expires_at_unix"`
	Revoked        bool    `json:"revoked"`
}
