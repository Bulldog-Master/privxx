package p7store

import (
	"sync"
	"time"
)

type Message struct {
	ID         string    `json:"id"`
	From       string    `json:"from"`
	Payload    string    `json:"payload"`
	ReceivedAt time.Time `json:"receivedAt"`
}

type Store struct {
	mu   sync.RWMutex
	data map[string]map[string][]Message // userID -> conversationID -> []Message (newest last)
}

func New() *Store {
	return &Store{
		data: make(map[string]map[string][]Message),
	}
}

// Add appends a message and enforces a max history per conversation.
func (s *Store) Add(userID, conversationID, from, payload string, receivedAt time.Time, maxPerConv int) Message {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.data[userID]; !ok {
		s.data[userID] = make(map[string][]Message)
	}

	msg := Message{
		ID:         receivedAt.UTC().Format("20060102T150405.000000000Z07:00"),
		From:       from,
		Payload:    payload,
		ReceivedAt: receivedAt.UTC(),
	}

	s.data[userID][conversationID] = append(s.data[userID][conversationID], msg)

	// trim oldest if over cap
	if maxPerConv > 0 && len(s.data[userID][conversationID]) > maxPerConv {
		excess := len(s.data[userID][conversationID]) - maxPerConv
		s.data[userID][conversationID] = s.data[userID][conversationID][excess:]
	}

	return msg
}

func (s *Store) Inbox(userID, conversationID string, limit int) []Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	convMap, ok := s.data[userID]
	if !ok {
		return nil
	}
	msgs, ok := convMap[conversationID]
	if !ok || len(msgs) == 0 {
		return nil
	}

	// return up to last N
	if limit <= 0 || limit >= len(msgs) {
		out := make([]Message, len(msgs))
		copy(out, msgs)
		return out
	}
	out := make([]Message, limit)
	copy(out, msgs[len(msgs)-limit:])
	return out
}
