package messages

import (
	"encoding/json"
	"errors"
)

// EnvelopeV1 is the Phase-1 internal envelope container.
// IMPORTANT:
// - The "ciphertext" field is what will be stored at rest.
// - Any plaintext exists only transiently in memory during compose/decrypt.
type EnvelopeV1 struct {
	V int `json:"v"`

	ConversationID string `json:"conversation_id"`

	// Optional opaque sender reference. Never used for lookup.
	SenderRefEncrypted []byte `json:"sender_ref_encrypted,omitempty"`

	// Ciphertext of the message payload (NOT plaintext). Stored at rest.
	Ciphertext []byte `json:"ciphertext"`

	CreatedAtUnix int64 `json:"created_at_unix"`
}

func (e *EnvelopeV1) Validate() error {
	if e.V != 1 {
		return errors.New("bad envelope version")
	}
	if e.ConversationID == "" {
		return errors.New("missing conversation_id")
	}
	if len(e.Ciphertext) == 0 {
		return errors.New("missing ciphertext")
	}
	if e.CreatedAtUnix <= 0 {
		return errors.New("missing created_at_unix")
	}
	return nil
}

func EncodeEnvelope(e *EnvelopeV1) ([]byte, error) {
	if e == nil {
		return nil, errors.New("nil envelope")
	}
	if err := e.Validate(); err != nil {
		return nil, err
	}
	return json.Marshal(e)
}

func DecodeEnvelope(b []byte) (*EnvelopeV1, error) {
	var e EnvelopeV1
	if err := json.Unmarshal(b, &e); err != nil {
		return nil, err
	}
	if err := e.Validate(); err != nil {
		return nil, err
	}
	return &e, nil
}
