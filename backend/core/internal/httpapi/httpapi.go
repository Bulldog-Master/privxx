package httpapi

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/Bulldog-Master/privxx/backend/core/contracts"
)

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
	writeJSON(w, http.StatusOK, contracts.SendMessageResult{Accepted: true})
}
