package main

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/conversations"
	"github.com/Bulldog-Master/privxx/backend/bridge/internal/messages"
	"github.com/Bulldog-Master/privxx/backend/bridge/internal/transport"
)


type phase1SessionPurpose string

const (
	purposeMessageSend    phase1SessionPurpose = "message_send"
	purposeMessageReceive phase1SessionPurpose = "message_receive"
)

type phase1SessionKey struct {
	OwnerSubject   string
	Purpose        string
	ConversationID string // empty = inbox scope (allowed only for message_receive)
}





// Cache-Control: no-store (required)
func noStore(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
}

func writeJSONP1(w http.ResponseWriter, status int, v any) {
	noStore(w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// Helper: get auth subject from existing auth middleware.
// Primary: existing bridge convention header X-User-Id.
// Secondary: consume what auth middleware already set in context.
func mustAuthSubject(r *http.Request) (string, bool) {
	if s := strings.TrimSpace(r.Header.Get("X-User-Id")); s != "" {
		return s, true
	}
	if v := r.Context().Value("auth_subject"); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s, true
		}
	}
	if v := r.Context().Value("sub"); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s, true
		}
	}
	return "", false
}

/*
Phase-1 routes ONLY (canonical):
- POST /session/issue (purpose-scoped)
- POST /conversation/create
- POST /message/send
- POST /message/inbox     (inbox scope fetch)
- POST /message/thread    (conversation-scoped fetch)
- POST /message/ack       (consume/ack)
*/
func registerPhase1Endpoints(
	convRepo *conversations.Repo,
	msgStore *messages.Store,
	tx transport.Adapter,
	orch *messages.Orchestrator,
) {
	_ = tx
        sessMgr := phase1SessionMgr
	// ---- POST /session/issue (purpose-scoped) ----
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
	// ---- POST /conversation/create ----
	// Creates or returns a conversation by peerFingerprint (idempotent).
	type convCreateReq struct {
		PeerFingerprint string `json:"peerFingerprint"`
		PeerRefB64      string `json:"peerRefEncryptedB64,omitempty"` // opaque; optional
	}
	type convCreateResp struct {
		ConversationID string `json:"conversationId"`
		ServerTime     string `json:"serverTime"`
	}
	http.HandleFunc("/conversation/create", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		noStore(w)
		if r.Method != http.MethodPost {
			writeJSONP1(w, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed"})
			return
		}
		ownerSubject, ok := mustAuthSubject(r)
		if !ok {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		var req convCreateReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_json"})
			return
		}
		if strings.TrimSpace(req.PeerFingerprint) == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "peerFingerprint_required"})
			return
		}
		var peerRef []byte
		if strings.TrimSpace(req.PeerRefB64) != "" {
			b, err := base64.StdEncoding.DecodeString(req.PeerRefB64)
			if err != nil {
				writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_peerRefEncryptedB64"})
				return
			}
			peerRef = b
		}
		conv, err := convRepo.CreateOrGetConversation(ownerSubject, req.PeerFingerprint, peerRef)
		if err != nil {
			writeJSONP1(w, http.StatusInternalServerError, map[string]any{"error": "conversation_create_failed", "detail": err.Error()})
			return
		}
		writeJSONP1(w, http.StatusOK, convCreateResp{
			ConversationID: conv.ConversationID,
			ServerTime:     time.Now().UTC().Format(time.RFC3339),
		})
	}))

	// ---- POST /message/send ----
	type sendRequestP1 struct {
		SessionID      string `json:"sessionId"`
		ConversationID string `json:"conversationId"`
		PlaintextB64   string `json:"plaintextB64"`
	}
	type sendResponseP1 struct {
		Status     string `json:"status"`
		ServerTime string `json:"serverTime"`
	}

	http.HandleFunc("/message/send", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		noStore(w)
		if r.Method != http.MethodPost {
			writeJSONP1(w, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed"})
			return
		}

		ownerSubject, ok := mustAuthSubject(r)
		if !ok {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}

		var req sendRequestP1
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_json"})
			return
		}
		if req.SessionID == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "sessionId_required"})
			return
		}
		if req.ConversationID == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "conversationId_required"})
			return
		}
		if req.PlaintextB64 == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "plaintextB64_required"})
			return
		}

		// Validate session (purpose-scoped)
		key := phase1SessionKey{OwnerSubject: ownerSubject, Purpose: string(purposeMessageSend), ConversationID: req.ConversationID}
		if !requirePhase1Session(sessMgr, key, req.SessionID) {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized", "detail": "invalid_session"})
			return
		}

		pt, err := base64.StdEncoding.DecodeString(req.PlaintextB64)
		if err != nil || len(pt) == 0 {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_plaintextB64"})
			return
		}

		if _, err := orch.SendText(r.Context(), ownerSubject, req.ConversationID, pt); err != nil {
			writeJSONP1(w, http.StatusInternalServerError, map[string]any{"error": "send_failed", "detail": err.Error()})
			return
		}

		writeJSONP1(w, http.StatusOK, sendResponseP1{Status: "Sent", ServerTime: time.Now().UTC().Format(time.RFC3339)})
	}))

	// ---- POST /message/inbox (inbox scope) ----
	type inboxRequestP1 struct {
		SessionID string `json:"sessionId"`
		Limit     int    `json:"limit,omitempty"`
	}
	type inboxItemP1 struct {
		ConversationID       string `json:"conversationId"`
		PayloadCiphertextB64 string `json:"payloadCiphertextB64"`
		EnvelopeFingerprint  string `json:"envelopeFingerprint,omitempty"`
		CreatedAtUnix        int64  `json:"createdAtUnix"`
		ExpiresAtUnix        int64  `json:"expiresAtUnix,omitempty"`
		State                string `json:"state"`
	}
	type inboxResponseP1 struct {
		Items      []inboxItemP1 `json:"items"`
		ServerTime string        `json:"serverTime"`
	}

	http.HandleFunc("/message/inbox", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		noStore(w)
		if r.Method != http.MethodPost {
			writeJSONP1(w, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed"})
			return
		}

		ownerSubject, ok := mustAuthSubject(r)
		if !ok {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}

		var req inboxRequestP1
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_json"})
			return
		}
		if req.SessionID == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "sessionId_required"})
			return
		}

		// inbox scope requires conversationId="" in session key
		key := phase1SessionKey{OwnerSubject: ownerSubject, Purpose: string(purposeMessageReceive), ConversationID: ""}
		if !requirePhase1Session(sessMgr, key, req.SessionID) {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized", "detail": "invalid_session"})
			return
		}

		items, err := msgStore.FetchInbox(ownerSubject, req.Limit)
		if err != nil {
			writeJSONP1(w, http.StatusInternalServerError, map[string]any{"error": "fetch_failed", "detail": err.Error()})
			return
		}

		resp := inboxResponseP1{ServerTime: time.Now().UTC().Format(time.RFC3339)}
		for _, it := range items {
			resp.Items = append(resp.Items, inboxItemP1{
				ConversationID:       it.ConversationID,
				PayloadCiphertextB64: it.PayloadCiphertextB64,
				EnvelopeFingerprint:  it.EnvelopeFingerprint,
				CreatedAtUnix:        it.CreatedAtUnix,
				ExpiresAtUnix:        it.ExpiresAtUnix,
				State:                it.State,
			})
		}
		writeJSONP1(w, http.StatusOK, resp)
	}))

	// ---- POST /message/thread (conversation scope) ----
	type threadRequestP1 struct {
		SessionID      string `json:"sessionId"`
		ConversationID string `json:"conversationId"`
		Limit          int    `json:"limit,omitempty"`

		IncludeConsumed *bool `json:"includeConsumed,omitempty"`
	}
	type threadResponseP1 struct {
		Items      []inboxItemP1 `json:"items"`
		ServerTime string        `json:"serverTime"`
	}

	http.HandleFunc("/message/thread", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		noStore(w)
		if r.Method != http.MethodPost {
			writeJSONP1(w, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed"})
			return
		}

		ownerSubject, ok := mustAuthSubject(r)
		if !ok {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}

		var req threadRequestP1
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_json"})
			return
		}
		if req.SessionID == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "sessionId_required"})
			return
		}
		if req.ConversationID == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "conversationId_required"})
			return
		}

		key := phase1SessionKey{OwnerSubject: ownerSubject, Purpose: string(purposeMessageReceive), ConversationID: req.ConversationID}
		if !requirePhase1Session(sessMgr, key, req.SessionID) {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized", "detail": "invalid_session"})
			return
		}

		includeConsumed := true
		if req.IncludeConsumed != nil {
			includeConsumed = *req.IncludeConsumed
		}

		items, err := msgStore.FetchThread(ownerSubject, req.ConversationID, req.Limit, includeConsumed)
		if err != nil {
			writeJSONP1(w, http.StatusInternalServerError, map[string]any{"error": "fetch_failed", "detail": err.Error()})
			return
		}

		resp := threadResponseP1{ServerTime: time.Now().UTC().Format(time.RFC3339)}
		for _, it := range items {
			resp.Items = append(resp.Items, inboxItemP1{
				ConversationID:       it.ConversationID,
				PayloadCiphertextB64: it.PayloadCiphertextB64,
				EnvelopeFingerprint:  it.EnvelopeFingerprint,
				CreatedAtUnix:        it.CreatedAtUnix,
				ExpiresAtUnix:        it.ExpiresAtUnix,
				State:                it.State,
			})
		}
		writeJSONP1(w, http.StatusOK, resp)
	}))

	// ---- POST /message/ack (consume) ----
	type ackRequestP1 struct {
		SessionID            string   `json:"sessionId"`
		ConversationID       string   `json:"conversationId,omitempty"` // "" allowed only with inbox-scoped receive session
		EnvelopeFingerprints []string `json:"envelopeFingerprints"`
	}
	type ackResponseP1 struct {
		Status     string `json:"status"`
		Acked      int    `json:"acked"`
		ServerTime string `json:"serverTime"`
	}

	http.HandleFunc("/message/ack", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		noStore(w)
		if r.Method != http.MethodPost {
			writeJSONP1(w, http.StatusMethodNotAllowed, map[string]any{"error": "method_not_allowed"})
			return
		}

		ownerSubject, ok := mustAuthSubject(r)
		if !ok {
			writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}

		var req ackRequestP1
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "invalid_json"})
			return
		}
		if req.SessionID == "" {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "sessionId_required"})
			return
		}
		if len(req.EnvelopeFingerprints) == 0 {
			writeJSONP1(w, http.StatusBadRequest, map[string]any{"error": "bad_request", "detail": "envelopeFingerprints_required"})
			return
		}

		// Validate correct receive session scope:
		// - If conversationId provided => must be conversation-scoped receive session
		// - If conversationId empty    => must be inbox-scoped receive session
		if strings.TrimSpace(req.ConversationID) != "" {
			key := phase1SessionKey{OwnerSubject: ownerSubject, Purpose: string(purposeMessageReceive), ConversationID: req.ConversationID}
			if !requirePhase1Session(sessMgr, key, req.SessionID) {
				writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized", "detail": "invalid_session"})
				return
			}
		} else {
			key := phase1SessionKey{OwnerSubject: ownerSubject, Purpose: string(purposeMessageReceive), ConversationID: ""}
			if !requirePhase1Session(sessMgr, key, req.SessionID) {
				writeJSONP1(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized", "detail": "invalid_session"})
				return
			}
		}

		acked, err := msgStore.AckAvailable(ownerSubject, req.ConversationID, req.EnvelopeFingerprints)
		if err != nil {
			writeJSONP1(w, http.StatusInternalServerError, map[string]any{"error": "ack_failed", "detail": err.Error()})
			return
		}

		writeJSONP1(w, http.StatusOK, ackResponseP1{
			Status:     "ok",
			Acked:      acked,
			ServerTime: time.Now().UTC().Format(time.RFC3339),
		})
	}))
}
