package httpapi

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Bulldog-Master/privxx/backend/core/contracts"
	"github.com/Bulldog-Master/privxx/backend/core/internal/p7store"
	"github.com/Bulldog-Master/privxx/backend/core/internal/p7browse"
)

var phase7Store = p7store.New()

type Server struct {
	mux *http.ServeMux
}

func NewServer() *Server {
	s := &Server{mux: http.NewServeMux()}

	// Health
	s.mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok", "stub": true})
	})

	// Contract endpoints (STUB)
	s.mux.HandleFunc("/v1/connect", s.handleConnect)
	s.mux.HandleFunc("/v1/conversations/open", s.handleOpenConversation)
	s.mux.HandleFunc("/v1/messages/send", s.handleSendMessage)
    s.mux.HandleFunc("/v1/messages/inbox", s.handleMessagesInbox)
    s.mux.HandleFunc("/v1/browse/preview", s.handleBrowsePreview)
    s.mux.HandleFunc("/v1/browse/fetch", s.handleBrowseFetch)

	return s
}

func (s *Server) Handler() http.Handler { return s.mux }

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return false
	}
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(contracts.ErrorResponse{
			Code:    contracts.ErrInvalidInput,
			Message: contracts.Ptr("invalid json"),
		})
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (s *Server) handleConnect(w http.ResponseWriter, r *http.Request) {
	var req contracts.ConnectIntent
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.V != contracts.ContractVersionV1 || req.UserID == "" {
		writeJSON(w, http.StatusBadRequest, contracts.ConnectResult{
			Ok: false,
			Error: &contracts.ErrorResponse{
				Code:    contracts.ErrInvalidInput,
				Message: contracts.Ptr("bad intent"),
			},
		})
		return
	}
	log.Printf("[BACKEND] connect intent user=%s", req.UserID)
	writeJSON(w, http.StatusOK, contracts.ConnectResult{Ok: true})
}

func (s *Server) handleOpenConversation(w http.ResponseWriter, r *http.Request) {
	var req contracts.OpenConversationIntent
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.V != contracts.ContractVersionV1 || req.UserID == "" || req.ConversationID == "" {
		writeJSON(w, http.StatusBadRequest, contracts.OpenConversationResult{
			Ok: false,
			Error: &contracts.ErrorResponse{
				Code:    contracts.ErrInvalidInput,
				Message: contracts.Ptr("bad intent"),
			},
		})
		return
	}
	log.Printf("[BACKEND] open conversation user=%s conv=%s", req.UserID, req.ConversationID)
	writeJSON(w, http.StatusOK, contracts.OpenConversationResult{Ok: true})
}

func (s *Server) handleSendMessage(w http.ResponseWriter, r *http.Request) {
	var req contracts.SendMessageIntent
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.V != contracts.ContractVersionV1 || req.UserID == "" || req.ConversationID == "" || len(req.Payload) == 0 {
		writeJSON(w, http.StatusBadRequest, contracts.SendMessageResult{
			Accepted: false,
			Error: &contracts.ErrorResponse{
				Code:    contracts.ErrInvalidInput,
				Message: contracts.Ptr("bad intent"),
			},
		})
		return
	}
	log.Printf("[BACKEND] send message user=%s conv=%s bytes=%d", req.UserID, req.ConversationID, len(req.Payload))
		// Phase 7B MVP: store message in memory (Phase 8 will replace storage)
		phase7Store.Add(req.UserID, req.ConversationID, "user", string(req.Payload), time.Now().UTC(), 200)
	writeJSON(w, http.StatusOK, contracts.SendMessageResult{Accepted: true})
}


// --- Phase 7B (B1) stubs: route wiring only ---
// NOTE: Logic will be implemented next step. These must compile now.

func (s *Server) handleMessagesInbox(w http.ResponseWriter, r *http.Request) {
        if r.Method != "POST" {
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
                return
        }

        var req struct {
                V              int    `json:"v"`
                UserID         string `json:"userId"`
                ConversationID string `json:"conversationId"`
                Limit          int    `json:"limit,omitempty"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "code": "bad_request", "message": "invalid json"})
                return
        }
        if req.V != contracts.ContractVersionV1 || req.UserID == "" || req.ConversationID == "" {
                writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "code": "bad_request", "message": "bad intent"})
                return
        }

        if req.Limit <= 0 || req.Limit > 100 {
                req.Limit = 50
        }

        msgs := phase7Store.Inbox(req.UserID, req.ConversationID, req.Limit)

        // map to response shape expected by Phase7 MVP (compatible with earlier bridge demo)
        out := make([]map[string]any, 0, len(msgs))
        for _, m := range msgs {
                out = append(out, map[string]any{
                        "id":         m.ID,
                        "from":       m.From,
                        "payload":    m.Payload,
                        "receivedAt": m.ReceivedAt.UTC().Format(time.RFC3339),
                })
        }

        writeJSON(w, http.StatusOK, map[string]any{"messages": out})
}

func (s *Server) handleBrowsePreview(w http.ResponseWriter, r *http.Request) {
        if r.Method != "POST" {
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
                return
        }

        var req struct {
                V          int    `json:"v"`
                UserID     string `json:"userId"`
                URL        string `json:"url"`
                ClientTime string `json:"clientTime"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "code": "bad_request", "message": "invalid json"})
                return
        }
        if req.V != contracts.ContractVersionV1 || req.UserID == "" || req.URL == "" {
                writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "code": "bad_request", "message": "bad intent"})
                return
        }

        pv, err := p7browse.PreviewURL(req.URL)
        if err != nil {
                // map known errors
                if te, ok := err.(*p7browse.TargetError); ok {
                        code := te.Code
                        status := http.StatusBadRequest
                        if code == "forbidden_target" {
                                status = http.StatusForbidden
                        }
                        writeJSON(w, status, map[string]any{"ok": false, "code": code, "message": te.Message})
                        return
                }
                writeJSON(w, http.StatusBadGateway, map[string]any{"ok": false, "code": "fetch_failed", "message": "fetch failed"})
                return
        }

        writeJSON(w, http.StatusOK, map[string]any{
                "ok":          true,
                "url":         req.URL,
                "finalUrl":    pv.FinalURL,
                "fetchedAt":   time.Now().UTC().Format(time.RFC3339),
                "status":      pv.Status,
                "contentType": pv.ContentType,
                "title":       pv.Title,
        })
}

func (s *Server) handleBrowseFetch(w http.ResponseWriter, r *http.Request) {
        if r.Method != "POST" {
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
                return
        }

        var req struct {
                V          int    `json:"v"`
                UserID     string `json:"userId"`
                URL        string `json:"url"`
                ClientTime string `json:"clientTime"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "code": "bad_request", "message": "invalid json"})
                return
        }
        if req.V != contracts.ContractVersionV1 || req.UserID == "" || req.URL == "" {
                writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "code": "bad_request", "message": "bad intent"})
                return
        }

        fx, err := p7browse.FetchURL(req.URL)
        if err != nil {
                if te, ok := err.(*p7browse.TargetError); ok {
                        code := te.Code
                        status := http.StatusBadRequest
                        if code == "forbidden_target" {
                                status = http.StatusForbidden
                        }
                        writeJSON(w, status, map[string]any{"ok": false, "code": code, "message": te.Message})
                        return
                }
                writeJSON(w, http.StatusBadGateway, map[string]any{"ok": false, "code": "fetch_failed", "message": "fetch failed"})
                return
        }

        writeJSON(w, http.StatusOK, map[string]any{
                "ok":          true,
                "url":         req.URL,
                "finalUrl":    fx.FinalURL,
                "fetchedAt":   time.Now().UTC().Format(time.RFC3339),
                "status":      fx.Status,
                "contentType": fx.ContentType,
                "title":       fx.Title,
                "text":        fx.Text,
        })
}
