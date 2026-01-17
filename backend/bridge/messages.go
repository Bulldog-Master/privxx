package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Message is the minimal message shape for the frontend inbox.
type Message struct {
	ID        string    `json:"id"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

// In-memory store (Phase-1). Later this will route via xxDK/backend persistence.
var msgStore = struct {
	mu    sync.Mutex
	inbox map[string][]Message // key: userID (or recipient key)
}{
	inbox: make(map[string][]Message),
}

type inboxResponse struct {
	Messages []Message `json:"messages"`
}

type sendRequest struct {
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
}

type sendResponse struct {
	MsgID  string `json:"msg_id"`
	Status string `json:"status"`
}

// GET /messages/inbox
func handleMessagesInbox(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := getUserIDFromContext(r.Context())
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{
			"error":   "unauthorized",
			"code":    "missing_user",
			"message": "User not found in context",
		})
		return
	}

	msgStore.mu.Lock()
	msgs := append([]Message(nil), msgStore.inbox[userID]...)
	msgStore.mu.Unlock()

	writeJSON(w, http.StatusOK, inboxResponse{Messages: msgs})
}

// POST /messages/send
func handleMessagesSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	senderID, ok := getUserIDFromContext(r.Context())
	if !ok || senderID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]any{
			"error":   "unauthorized",
			"code":    "missing_user",
			"message": "User not found in context",
		})
		return
	}

	var req sendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"error":   "bad_request",
			"code":    "INVALID_MESSAGE",
			"message": "Invalid JSON body",
		})
		return
	}
	if req.Recipient == "" || req.Message == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"error":   "bad_request",
			"code":    "MISSING_FIELDS",
			"message": "recipient and message are required",
		})
		return
	}

	now := time.Now().UTC()
	msgID := fmt.Sprintf("msg-%d", now.UnixNano())

	msg := Message{
		ID:        msgID,
		From:      senderID,
		To:        req.Recipient,
		Body:      req.Message,
		CreatedAt: now,
	}

	// Phase-1: store in recipient inbox (keyed by string).
	// NOTE: For now this expects recipient to be a userID-like key.
	msgStore.mu.Lock()
	msgStore.inbox[req.Recipient] = append(msgStore.inbox[req.Recipient], msg)
	msgStore.mu.Unlock()

	writeJSON(w, http.StatusOK, sendResponse{MsgID: msgID, Status: "queued"})
}
