package sessions

import (
	"crypto/rand"
	"errors"
	"fmt"
	"sync"
	"time"
)

var (
	ErrSessionNotFound   = errors.New("session not found")
	ErrSessionExpired    = errors.New("session expired")
	ErrSessionRevoked    = errors.New("session revoked")
	ErrSessionForbidden  = errors.New("session forbidden for caller")
	ErrInvalidPurpose    = errors.New("invalid session purpose")
)

// Manager owns all active Phase-1 sessions.
// Phase-1 storage: in-memory with TTL (replaceable later).
type Manager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	ttl      time.Duration
}

func NewManager(ttl time.Duration) *Manager {
	return &Manager{
		sessions: make(map[string]*Session),
		ttl:      ttl,
	}
}

// Issue creates a new session bound to authSubject.
// conversationID may be nil ONLY for inbox-scoped message_receive.
func (m *Manager) Issue(
	authSubject string,
	purpose Purpose,
	conversationID *string,
) (*Session, error) {

	if authSubject == "" {
		return nil, fmt.Errorf("authSubject required")
	}

	switch purpose {
	case PurposeMessageSend:
		if conversationID == nil {
			return nil, fmt.Errorf("message_send requires conversation_id")
		}
	case PurposeMessageReceive:
		// conversationID optional (nil = inbox-scoped)
	default:
		return nil, ErrInvalidPurpose
	}

	sid, err := newOpaqueID("sess")
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	s := &Session{
		SessionID:      sid,
		AuthSubject:    authSubject,
		Purpose:        purpose,
		ConversationID: conversationID,
		ExpiresAtUnix:  now.Add(m.ttl).Unix(),
		Revoked:        false,
	}

	m.mu.Lock()
	m.sessions[sid] = s
	m.mu.Unlock()

	return s, nil
}

// Validate verifies:
// 1) session exists
// 2) not expired
// 3) not revoked
// 4) bound to caller authSubject
// 5) purpose matches expected
func (m *Manager) Validate(
	sessionID string,
	authSubject string,
	expectedPurpose Purpose,
) (*Session, error) {

	m.mu.RLock()
	s, ok := m.sessions[sessionID]
	m.mu.RUnlock()

	if !ok {
		return nil, ErrSessionNotFound
	}

	if s.Revoked {
		return nil, ErrSessionRevoked
	}

	if time.Now().UTC().Unix() > s.ExpiresAtUnix {
		return nil, ErrSessionExpired
	}

	if s.AuthSubject != authSubject {
		return nil, ErrSessionForbidden
	}

	if s.Purpose != expectedPurpose {
		return nil, ErrInvalidPurpose
	}

	return s, nil
}

// Revoke invalidates a session immediately.
func (m *Manager) Revoke(sessionID string, authSubject string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	s, ok := m.sessions[sessionID]
	if !ok {
		return ErrSessionNotFound
	}

	if s.AuthSubject != authSubject {
		return ErrSessionForbidden
	}

	s.Revoked = true
	return nil
}

// Cleanup removes expired sessions.
// Safe to call periodically.
func (m *Manager) Cleanup() {
	now := time.Now().UTC().Unix()

	m.mu.Lock()
	defer m.mu.Unlock()

	for id, s := range m.sessions {
		if s.Revoked || now > s.ExpiresAtUnix {
			delete(m.sessions, id)
		}
	}
}

// ---- helpers ----

func newOpaqueID(prefix string) (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return fmt.Sprintf("%s_%x", prefix, b[:]), nil
}
