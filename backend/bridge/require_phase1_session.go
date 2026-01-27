package main

import (
	"log"
	"strings"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/sessions"
)

// requirePhase1Session validates a session against the canonical in-memory Manager.
// It also enforces inbox-scope vs conversation-scope matching.
func requirePhase1Session(m *sessions.Manager, key phase1SessionKey, sessionID string) bool {
	p := sessions.Purpose(strings.TrimSpace(key.Purpose))
	s, err := m.Validate(sessionID, strings.TrimSpace(key.OwnerSubject), p)
	if err != nil {
		log.Printf("P1 session INVALID sid=%s subj=%s purpose=%s err=%v", sessionID, strings.TrimSpace(key.OwnerSubject), p, err)
		return false
	}

	conv := strings.TrimSpace(key.ConversationID)
	if conv == "" {
		if s.ConversationID != nil {
			log.Printf("P1 session SCOPE mismatch: expected inbox-scope, got conv=%s sid=%s", strings.TrimSpace(*s.ConversationID), sessionID)
			return false
		}
		return true
	}
	if s.ConversationID == nil {
		return false
	}
	return strings.TrimSpace(*s.ConversationID) == conv
}
