package backend

import "time"

// Holder exists to make backend wiring explicit and controlled.
// It is NOT used yet.
type Holder struct {
	Client *Client
}

// NewDisabled returns a holder with no active backend client.
// This preserves compile-time structure without runtime behavior.
func NewDisabled() *Holder {
	return &Holder{
		Client: nil,
	}
}

// NewWithConfig exists for later wiring, but MUST NOT be called yet.
func NewWithConfig(addr string, timeout time.Duration) *Holder {
	return &Holder{
		Client: New(addr, timeout),
	}
}
