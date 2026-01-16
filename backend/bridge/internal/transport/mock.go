package transport

import (
	"context"
	"errors"
	"sync"
)

var (
	ErrEnvelopeTooLarge = errors.New("envelope too large")
	ErrNoReceiveHandler = errors.New("no receive handler set")
	ErrAlreadyStarted   = errors.New("already started")
)

// MockAdapter compiles without xxDK and enforces Phase-1 constraints:
// - max envelope size
// - exactly one active receive handler (replacement semantics)
type MockAdapter struct {
	mu               sync.Mutex
	maxEnvelopeBytes int
	handler          ReceiveHandler
	started          bool
}

func NewMockAdapter(maxEnvelopeBytes int) *MockAdapter {
	if maxEnvelopeBytes <= 0 {
		maxEnvelopeBytes = 4096 // Phase-1 default cap
	}
	return &MockAdapter{maxEnvelopeBytes: maxEnvelopeBytes}
}

func (m *MockAdapter) Send(ctx context.Context, envelope []byte) error {
	_ = ctx
	if len(envelope) > m.maxEnvelopeBytes {
		return ErrEnvelopeTooLarge
	}
	// No-op in mock.
	return nil
}

func (m *MockAdapter) SetReceiveHandler(h ReceiveHandler) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Replacement semantics: new handler replaces old.
	m.handler = h
	return nil
}

func (m *MockAdapter) Start(ctx context.Context) error {
	_ = ctx
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.started {
		return ErrAlreadyStarted
	}
	if m.handler == nil {
		return ErrNoReceiveHandler
	}
	m.started = true
	return nil
}

func (m *MockAdapter) Stop() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.started = false
	return nil
}
