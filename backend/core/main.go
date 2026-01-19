package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

const (
	v1 = 1
)

type Resp struct {
	V         int     `json:"v"`
	Type      string  `json:"type"`
	RequestID string  `json:"requestId"`
	Ok        bool    `json:"ok"`
	ErrorCode *string `json:"errorCode,omitempty"`
	Message   *string `json:"message,omitempty"`

	// Optional fields used by some responses:
	ExpiresAt  *string `json:"expiresAt,omitempty"`
	TTLSeconds *int    `json:"ttlSeconds,omitempty"`
	Unlocked   *bool   `json:"unlocked,omitempty"`
	UnlockedAt *string `json:"unlockedAt,omitempty"`
	Status     *string `json:"status,omitempty"`
	SessionID  *string `json:"sessionId,omitempty"`
	Bridge     any     `json:"bridge,omitempty"`
	Backend    any     `json:"backend,omitempty"`
	Identity   any     `json:"identity,omitempty"`
}

type UnlockReq struct {
	V         int    `json:"v"`
	Type      string `json:"type"`
	RequestID string `json:"requestId"`
	Password  string `json:"password"`
}

type SimpleReq struct {
	V         int    `json:"v"`
	Type      string `json:"type"`
	RequestID string `json:"requestId"`
}

type ConnectReq struct {
	V         int    `json:"v"`
	Type      string `json:"type"`
	RequestID string `json:"requestId"`
	TargetURL string `json:"targetUrl"`
}

type IdentitySession struct {
	Unlocked   bool
	UnlockedAt time.Time
	ExpiresAt  time.Time
}

type Server struct {
	mu       sync.Mutex
	sessions map[string]IdentitySession
	ttl      time.Duration
}

func main() {
	var (
		addr = flag.String("addr", "127.0.0.1:8091", "listen address")
		ttl  = flag.Duration("ttl", 15*time.Minute, "identity session TTL")
	)
	flag.Parse()

	s := &Server{
		sessions: make(map[string]IdentitySession),
		ttl:      *ttl,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/v1/identity/unlock", s.handleUnlock)
	mux.HandleFunc("/v1/identity/lock", s.handleLock)
	mux.HandleFunc("/v1/identity/status", s.handleIdentityStatus)
	mux.HandleFunc("/v1/connect", s.handleConnect)
	mux.HandleFunc("/v1/disconnect", s.handleDisconnect)
	mux.HandleFunc("/v1/status", s.handleStatus)

	srv := &http.Server{
		Addr:              *addr,
		Handler:           logMiddleware(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("[BACKEND] stub starting on %s (ttl=%s)", *addr, s.ttl)
	log.Fatal(srv.ListenAndServe())
}

func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[BACKEND] %s %s (%s)", r.Method, r.URL.Path, time.Since(start))
	})
}

func (s *Server) requireHeaders(w http.ResponseWriter, r *http.Request) (userID, reqID string, ok bool) {
	userID = strings.TrimSpace(r.Header.Get("X-User-Id"))
	reqID = strings.TrimSpace(r.Header.Get("X-Request-Id"))
	if userID == "" || reqID == "" {
		writeJSON(w, http.StatusBadRequest, Resp{
			V:         v1,
			Type:      "error",
			RequestID: reqID,
			Ok:        false,
			ErrorCode: strPtr("MISSING_HEADERS"),
			Message:   strPtr("X-User-Id and X-Request-Id are required"),
		})
		return "", "", false
	}
	return userID, reqID, true
}

func (s *Server) getSession(userID string) (IdentitySession, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sess, exists := s.sessions[userID]
	if !exists {
		return IdentitySession{}, false
	}
	if time.Now().After(sess.ExpiresAt) {
		delete(s.sessions, userID)
		return IdentitySession{}, false
	}
	return sess, true
}

func (s *Server) setSession(userID string, unlocked bool) IdentitySession {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	sess := IdentitySession{
		Unlocked:   unlocked,
		UnlockedAt: now,
		ExpiresAt:  now.Add(s.ttl),
	}
	s.sessions[userID] = sess
	return sess
}

func (s *Server) clearSession(userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, userID)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")

	resp := map[string]interface{}{
		"status":  "ok",
		"version": "0.4.0",
		"capabilities": map[string]bool{
			"messaging": true,
			"tunnel":    false,
			"decrypt":   true,
		},
	}

	_ = json.NewEncoder(w).Encode(resp)
}

func (s *Server) handleUnlock(w http.ResponseWriter, r *http.Request) {
	userID, reqID, ok := s.requireHeaders(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body UnlockReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "unlock_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE"), Message: strPtr("invalid JSON")})
		return
	}
	if body.Type != "unlock" || body.V != v1 {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "unlock_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE"), Message: strPtr("expected type=unlock v=1")})
		return
	}
	if strings.TrimSpace(body.Password) == "" {
		writeJSON(w, http.StatusUnauthorized, Resp{V: v1, Type: "unlock_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_PASSWORD"), Message: strPtr("password required")})
		return
	}

	sess := s.setSession(userID, true)
	exp := sess.ExpiresAt.Format(time.RFC3339)
	ttl := int(time.Until(sess.ExpiresAt).Seconds())

	writeJSON(w, http.StatusOK, Resp{
		V:         v1,
		Type:      "unlock_ack",
		RequestID: reqID,
		Ok:        true,
		ExpiresAt: &exp,
		TTLSeconds: func() *int {
			return &ttl
		}(),
	})
}

func (s *Server) handleLock(w http.ResponseWriter, r *http.Request) {
	userID, reqID, ok := s.requireHeaders(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body SimpleReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "lock_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE")})
		return
	}
	if body.Type != "lock" || body.V != v1 {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "lock_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE"), Message: strPtr("expected type=lock v=1")})
		return
	}

	s.clearSession(userID)
	writeJSON(w, http.StatusOK, Resp{V: v1, Type: "lock_ack", RequestID: reqID, Ok: true})
}

func (s *Server) handleIdentityStatus(w http.ResponseWriter, r *http.Request) {
	_, reqID, ok := s.requireHeaders(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := strings.TrimSpace(r.Header.Get("X-User-Id"))
	sess, exists := s.getSession(userID)

	unlocked := false
	var unlockedAt *string
	var expiresAt *string
	ttl := 0

	if exists && sess.Unlocked {
		unlocked = true
		ua := sess.UnlockedAt.Format(time.RFC3339)
		ea := sess.ExpiresAt.Format(time.RFC3339)
		unlockedAt = &ua
		expiresAt = &ea
		ttl = int(time.Until(sess.ExpiresAt).Seconds())
		if ttl < 0 {
			ttl = 0
		}
	}

	writeJSON(w, http.StatusOK, Resp{
		V:          v1,
		Type:       "identity_status",
		RequestID:  reqID,
		Ok:         true,
		Unlocked:   &unlocked,
		UnlockedAt: unlockedAt,
		ExpiresAt:  expiresAt,
		TTLSeconds: func() *int {
			return &ttl
		}(),
	})
}

func (s *Server) handleConnect(w http.ResponseWriter, r *http.Request) {
	userID, reqID, ok := s.requireHeaders(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Must be unlocked
	sess, exists := s.getSession(userID)
	if !exists || !sess.Unlocked {
		writeJSON(w, http.StatusForbidden, Resp{V: v1, Type: "connect_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("SESSION_LOCKED"), Message: strPtr("Identity session is locked. Call POST /unlock first.")})
		return
	}

	var body ConnectReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "connect_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE")})
		return
	}

	// LOCKED RULE: must be connect_intent
	if body.V != v1 || body.Type != "connect_intent" {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "connect_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE"), Message: strPtr("expected type=connect_intent v=1")})
		return
	}

	if !strings.HasPrefix(body.TargetURL, "http://") && !strings.HasPrefix(body.TargetURL, "https://") {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "connect_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_URL"), Message: strPtr("targetUrl must start with http:// or https://")})
		return
	}

	status := "connected"
	empty := ""
	writeJSON(w, http.StatusOK, Resp{
		V:         v1,
		Type:      "connect_ack",
		RequestID: reqID,
		Ok:        true,
		Status:    &status,
		SessionID: &empty,
	})
}

func (s *Server) handleDisconnect(w http.ResponseWriter, r *http.Request) {
	_, reqID, ok := s.requireHeaders(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var body SimpleReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "disconnect_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE")})
		return
	}
	if body.Type != "disconnect" || body.V != v1 {
		writeJSON(w, http.StatusBadRequest, Resp{V: v1, Type: "disconnect_ack", RequestID: reqID, Ok: false, ErrorCode: strPtr("INVALID_MESSAGE"), Message: strPtr("expected type=disconnect v=1")})
		return
	}

	status := "disconnected"
	writeJSON(w, http.StatusOK, Resp{V: v1, Type: "disconnect_ack", RequestID: reqID, Ok: true, Status: &status})
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	userID, reqID, ok := s.requireHeaders(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	sess, exists := s.getSession(userID)
	unlocked := false
	var expiresAt any = nil
	if exists && sess.Unlocked {
		unlocked = true
		expiresAt = sess.ExpiresAt.Format(time.RFC3339)
	}

	writeJSON(w, http.StatusOK, Resp{
		V:         v1,
		Type:      "status",
		RequestID: reqID,
		Ok:        true,
		Backend: map[string]any{
			"ready":     true,
			"xxdkReady": true, // stubbed true for now
		},
		Identity: map[string]any{
			"unlocked":  unlocked,
			"expiresAt": expiresAt,
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func strPtr(s string) *string { return &s }
