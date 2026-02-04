package p7store

import (
	"sync"
	"time"

	"github.com/Bulldog-Master/privxx/backend/core/contracts"
)

type messageRecord struct {
	contracts.MessageV1
}

type MemStore struct {
	mu       sync.Mutex
	messages map[string][]messageRecord // conversationID -> messages
}

func NewMemStore() *MemStore {
	return &MemStore{
		messages: make(map[string][]messageRecord),
	}
}

// AppendMessage stores a message in-memory.
// Phase 7B: payload stored inline; Phase 8 will externalize storage.
func (s *MemStore) AppendMessage(conversationID, from, payload string) contracts.MessageV1 {
	s.mu.Lock()
	defer s.mu.Unlock()

	msg := contracts.MessageV1{
		ID:         generateID(),
		From:       from,
		Payload:    payload,
		ReceivedAt: time.Now().UTC(),
	}

	s.messages[conversationID] = append(
		s.messages[conversationID],
		messageRecord{MessageV1: msg},
	)

	return msg
}

// ListMessages returns messages ordered oldest -> newest.
func (s *MemStore) ListMessages(conversationID, sinceID string, limit int) []contracts.MessageV1 {
	s.mu.Lock()
	defer s.mu.Unlock()

	const maxLimit = 100
	if limit <= 0 || limit > maxLimit {
		limit = maxLimit
	}

	recs := s.messages[conversationID]
	if len(recs) == 0 {
		return nil
	}

	start := 0
	if sinceID != "" {
		found := false
		for i, r := range recs {
			if r.ID == sinceID {
				start = i + 1
				found = true
				break
			}
		}
		if !found {
			return nil
		}
	}

	end := start + limit
	if end > len(recs) {
		end = len(recs)
	}

	out := make([]contracts.MessageV1, 0, end-start)
	for _, r := range recs[start:end] {
		out = append(out, r.MessageV1)
	}

	return out
}

func generateID() string {
	return time.Now().UTC().Format("20060102T150405.000000000Z")
}
