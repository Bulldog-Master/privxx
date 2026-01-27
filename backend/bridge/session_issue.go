package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/sessions"
)

var phase1SessionMgr = sessions.NewManager(15 * time.Minute)

type sessionIssueRequest struct {
	Purpose        string `json:"purpose"`
	ConversationID string `json:"conversationId,omitempty"`
}

type sessionIssueResponse struct {
	SessionID      string `json:"sessionId"`
	Purpose        string `json:"purpose"`
	ConversationID string `json:"conversationId,omitempty"`
	ServerTime     string `json:"serverTime"`
}

func handleSessionIssue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "method_not_allowed"})
		return
	}

	ownerSubject := strings.TrimSpace(r.Header.Get("X-User-Id"))
	if ownerSubject == "" {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "unauthorized"})
		return
	}

	var req sessionIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "bad_request", "detail": "invalid_json"})
		return
	}

	p := sessions.Purpose(strings.TrimSpace(req.Purpose))
	if p != sessions.PurposeMessageSend && p != sessions.PurposeMessageReceive {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "bad_request", "detail": "invalid_purpose"})
		return
	}

	convID := strings.TrimSpace(req.ConversationID)
	if p == sessions.PurposeMessageSend && convID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "bad_request", "detail": "conversationId_required"})
		return
	}

	var convPtr *string
	if convID != "" {
		convPtr = &convID
	}

	s, err := phase1SessionMgr.Issue(ownerSubject, p, convPtr)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "session_issue_failed"})
		return
	}

	resp := sessionIssueResponse{
		SessionID:      s.SessionID,
		Purpose:        string(p),
		ConversationID: convID,
		ServerTime:     time.Now().UTC().Format(time.RFC3339),
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
