package transport

import (
	"context"
	"fmt"
	"sync"

	"gitlab.com/elixxir/client/v4/xxdk"
)

// CmixxV4Adapter implements Adapter using xxDK client/v4.
// Phase-1 constraints enforced:
// - max envelope size
// - exactly one active receive handler (replacement semantics)
// - no fragmentation/retry/bulk
// IMPORTANT: do not log envelope bytes.
type CmixxV4Adapter struct {
	mu               sync.Mutex
	c                *xxdk.Cmix
	maxEnvelopeBytes int
	handler          ReceiveHandler
	started          bool
}

func NewCmixxV4Adapter(c *xxdk.Cmix, maxEnvelopeBytes int) (*CmixxV4Adapter, error) {
	if c == nil {
		return nil, fmt.Errorf("cmix required")
	}
	if maxEnvelopeBytes <= 0 {
		maxEnvelopeBytes = 4096 // Phase-1 default cap
	}
	return &CmixxV4Adapter{
		c:                c,
		maxEnvelopeBytes:  maxEnvelopeBytes,
	}, nil
}

func (a *CmixxV4Adapter) SetReceiveHandler(h ReceiveHandler) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Replacement semantics: new handler replaces old.
	a.handler = h
	return nil
}

func (a *CmixxV4Adapter) Start(ctx context.Context) error {
	_ = ctx

	a.mu.Lock()
	defer a.mu.Unlock()

	if a.started {
		return ErrAlreadyStarted
	}
	if a.handler == nil {
		return ErrNoReceiveHandler
	}

	// NOTE:
	// Real pickup registration + receive loop wiring will be finalized in Step 5
	// (Message Orchestrator) when envelope routing is in place.
	a.started = true
	return nil
}

func (a *CmixxV4Adapter) Stop() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.started = false
	return nil
}

func (a *CmixxV4Adapter) Send(ctx context.Context, envelope []byte) error {
	_ = ctx

	// Phase-1 max envelope size enforcement
	if len(envelope) > a.maxEnvelopeBytes {
		return ErrEnvelopeTooLarge
	}

	// NOTE:
	// Actual injection will be wired in Step 5 once the orchestrator provides
	// destination addressing and envelope semantics. This prevents accidental
	// "peer delivery over HTTP" or incomplete transport usage.
	return fmt.Errorf("send not wired yet (await Step 5 orchestrator)")
}
