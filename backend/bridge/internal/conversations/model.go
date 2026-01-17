package conversations

// Conversation is the Phase-1 canonical conversation record.
// NOTE: peerFingerprint is internal-only and never exposed or logged.
type Conversation struct {
	OwnerSubject      string `json:"owner_subject"`        // jwt.sub (internal)
	ConversationID    string `json:"conversation_id"`
	PeerFingerprint   string `json:"peer_fingerprint"`    // internal-only lookup key
	PeerRefEncrypted  []byte `json:"peer_ref_encrypted"`  // opaque bytes, never used for lookup
	CreatedAtUnix     int64  `json:"created_at_unix"`      // backend-only
	State             string `json:"state"`               // "active" | "archived"
}
