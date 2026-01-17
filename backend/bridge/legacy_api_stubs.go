package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// Minimal auth middleware used by Phase-1 routes.
// For now: require Bearer token unless BRIDGE_API_ONLY=true (then allow).
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// If running in API-only/dev mode, allow (keeps Phase-1 compile/run simple).
		if strings.EqualFold(os.Getenv("BRIDGE_API_ONLY"), "true") {
			next(w, r)
			return
		}

		authz := r.Header.Get("Authorization")
		if !strings.HasPrefix(authz, "Bearer ") {
			writeJWTError(w, http.StatusUnauthorized, &JWTError{
				Error:   "unauthorized",
				Code:    "missing_token",
				Message: "Missing Authorization Bearer token",
			})
			return
		}
		token := strings.TrimSpace(strings.TrimPrefix(authz, "Bearer "))

		// Local verify (Phase-1). If not configured, treat as unauthorized.
		claims, jerr := verifyJWTLocal(token, os.Getenv("SUPABASE_ANON_KEY"))
		if jerr != nil || claims == nil || claims.Sub == "" {
			writeJWTError(w, http.StatusUnauthorized, jerr)
			return
		}

		next(w, r)
	}
}

func writeJWTError(w http.ResponseWriter, code int, e *JWTError) {
	if e == nil {
		e = &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Unauthorized"}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(e)
}

// ---- Legacy v0.4.0 endpoints (compile-safe stubs) ----

type healthResp struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	XXDKReady bool   `json:"xxdkReady"`
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(healthResp{
		Status:    "ok",
		Version:   "0.4.0",
		XXDKReady: false,
	})
}

func handleUnlock(w http.ResponseWriter, r *http.Request)       { writeOK(w) }
func handleUnlockStatus(w http.ResponseWriter, r *http.Request) { writeOK(w) }
func handleLock(w http.ResponseWriter, r *http.Request)         { writeOK(w) }
func handleStatus(w http.ResponseWriter, r *http.Request)       { writeOK(w) }
func handleDisconnect(w http.ResponseWriter, r *http.Request)   { writeOK(w) }

// Frontend expects an envelope for /connect.
type ConnectAck struct {
	V          int    `json:"v"`
	Type       string `json:"type"`
	RequestID  string `json:"requestId"`
	SessionID  string `json:"sessionId"`
	Ack        bool   `json:"ack"`
	Status     string `json:"status"`
	ServerTime string `json:"serverTime"`
}

func handleConnect(w http.ResponseWriter, r *http.Request) {
	reqID := getRequestID(r)
	resp := ConnectAck{
		V:          1,
		Type:       "connect_ack",
		RequestID:  reqID,
		SessionID:  "stub-session",
		Ack:        true,
		Status:     "connected",
		ServerTime: time.Now().UTC().Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func getRequestID(r *http.Request) string {
	// Try common places first
	if v := strings.TrimSpace(r.Header.Get("X-Request-Id")); v != "" {
		return v
	}
	if v := strings.TrimSpace(r.Header.Get("X-Request-ID")); v != "" {
		return v
	}
	if v := strings.TrimSpace(r.URL.Query().Get("requestId")); v != "" {
		return v
	}
	if v := strings.TrimSpace(r.URL.Query().Get("request_id")); v != "" {
		return v
	}
	// Fallback deterministic-ish
	return fmt.Sprintf("req-%d", time.Now().UnixNano())
}

func writeOK(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"ok":      true,
		"ts_unix": time.Now().Unix(),
		"note":    "stub",
	})
}
