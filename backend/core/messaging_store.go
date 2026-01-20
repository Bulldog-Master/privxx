package main

import (
	"fmt"
	"sync"
	"time"
)

// MsgStore is an in-memory message store (Phase-5).
// - No persistence (clears on restart)
// - Backend-core only (localhost)
type MsgStore struct {
	mu     sync.Mutex
	seq    uint64
	byUser map[string][]Message
	byConv map[ConversationID][]Message
}

func NewMsgStore() *MsgStore {
	return &MsgStore{
		byUser: make(map[string][]Message),
		byConv: make(map[ConversationID][]Message),
	}
}

func (s *MsgStore) nextID() MessageID {
	s.seq++
	return MessageID(fmt.Sprintf("msg-%d", s.seq))
}

func (s *MsgStore) Add(userID string, convID ConversationID, body string) Message {
	s.mu.Lock()
	defer s.mu.Unlock()

	m := Message{
		ID:             s.nextID(),
		ConversationID: convID,
		Sender:         userID,
		Body:           body,
		Timestamp:      time.Now().UTC(),
		Consumed:       false,
	}

	s.byUser[userID] = append(s.byUser[userID], m)
	s.byConv[convID] = append(s.byConv[convID], m)
	return m
}

func (s *MsgStore) Inbox(userID string) []Message {
	s.mu.Lock()
	defer s.mu.Unlock()

	src := s.byUser[userID]
	out := make([]Message, len(src))
	copy(out, src)
	return out
}

func (s *MsgStore) Thread(convID ConversationID) []Message {
	s.mu.Lock()
	defer s.mu.Unlock()

	src := s.byConv[convID]
	out := make([]Message, len(src))
	copy(out, src)
	return out
}
