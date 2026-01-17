package messages

// MessageRecord is the Phase-1 stored message unit.
// Ciphertext only: no plaintext is persisted.
type MessageRecord struct {
	MessageID             string  `json:"message_id"`
	OwnerSubject          string  `json:"owner_subject"`            // jwt.sub (internal)
	ConversationID         string  `json:"conversation_id"`         // internal convo id
	PayloadCiphertextB64  string  `json:"payload_ciphertext_b64"`   // ciphertext only
	EnvelopeFingerprint   *string `json:"envelope_fingerprint,omitempty"` // optional
	CreatedAtUnix         int64   `json:"created_at_unix"`
	ExpiresAtUnix         int64   `json:"expires_at_unix"`          // Created + 30 days
	State                 string  `json:"state"`                   // internal: "available"
}
