package transport

import "context"

// ReceiveHandler is called for each received envelope.
// IMPORTANT: handler must treat payload as sensitive and avoid logging.
type ReceiveHandler func(ctx context.Context, envelope []byte) error

// Adapter provides Phase-1 transport operations.
// Phase-1: no fragmentation, no retries, no bulk transport.
type Adapter interface {
	// Send injects a single envelope into cMixx.
	Send(ctx context.Context, envelope []byte) error

	// SetReceiveHandler installs the single active receive handler.
	// Must guarantee exactly one active handler:
	// - either replace old handler, or return error explicitly.
	SetReceiveHandler(h ReceiveHandler) error

	// Start begins receiving.
	Start(ctx context.Context) error

	// Stop ends receiving.
	Stop() error
}
