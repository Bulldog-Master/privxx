package main

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// Minimal auth middleware used by Phase-5 routes.
// Require Bearer token unless BRIDGE_API_ONLY=true (then allow).
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

// ---- Phase-5 compatibility responses ----

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

// ---- Unlock/Lock (in-memory TTL) ----

var (
	unlockMu      sync.Mutex
	unlockedUntil time.Time
	unlockTTL     = 15 * time.Minute
)

type unlockStatusResp struct {
	Unlocked            bool   `json:"unlocked"`
	ExpiresAt           string `json:"expiresAt,omitempty"`
	TTLRemainingSeconds int64  `json:"ttlRemainingSeconds,omitempty"`
}

type unlockReq struct {
	Password string `json:"password"`
}

type unlockResp struct {
	Success    bool   `json:"success"`
	ExpiresAt  string `json:"expiresAt,omitempty"`
	TTLSeconds int64  `json:"ttlSeconds,omitempty"`
	Error      string `json:"error,omitempty"`
}

type lockResp struct {
	Success bool `json:"success"`
}

func isUnlockedNow() (bool, time.Time) {
	unlockMu.Lock()
	defer unlockMu.Unlock()
	if unlockedUntil.IsZero() {
		return false, time.Time{}
	}
	if time.Now().Before(unlockedUntil) {
		return true, unlockedUntil
	}
	// expired
	unlockedUntil = time.Time{}
	return false, time.Time{}
}

func handleUnlockStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ok, exp := isUnlockedNow()
	if !ok {
		_ = json.NewEncoder(w).Encode(unlockStatusResp{Unlocked: false})
		return
	}

	ttl := int64(time.Until(exp).Seconds())
	if ttl < 0 {
		ttl = 0
	}
	_ = json.NewEncoder(w).Encode(unlockStatusResp{
		Unlocked:            true,
		ExpiresAt:           exp.UTC().Format(time.RFC3339),
		TTLRemainingSeconds: ttl,
	})
}

func handleUnlock(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(unlockResp{Success: false, Error: "method_not_allowed"})
		return
	}

	var req unlockReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(unlockResp{Success: false, Error: "bad_json"})
		return
	}
	if strings.TrimSpace(req.Password) == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(unlockResp{Success: false, Error: "missing_password"})
		return
	}

	// Phase-5 stub behavior: any non-empty password unlocks for TTL.
	unlockMu.Lock()
	unlockedUntil = time.Now().Add(unlockTTL)
	exp := unlockedUntil
	unlockMu.Unlock()

	_ = json.NewEncoder(w).Encode(unlockResp{
		Success:    true,
		ExpiresAt:  exp.UTC().Format(time.RFC3339),
		TTLSeconds: int64(unlockTTL.Seconds()),
	})
}

func handleLock(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(lockResp{Success: false})
		return
	}

	unlockMu.Lock()
	unlockedUntil = time.Time{}
	unlockMu.Unlock()

	_ = json.NewEncoder(w).Encode(lockResp{Success: true})
}

// ---- Connect + status/disconnect (phase-5 safe stubs) ----

type connectAck struct {
	V          int    `json:"v"`
	Type       string `json:"type"`
	RequestID  string `json:"requestId"`
	SessionID  string `json:"sessionId"`
	Ack        bool   `json:"ack"`
	Status     string `json:"status"`
	ServerTime string `json:"serverTime"`
}

func handleConnect(w http.ResponseWriter, r *http.Request) {
	reqID := strings.TrimSpace(r.Header.Get("X-Request-Id"))
	if reqID == "" {
		reqID = strings.TrimSpace(r.URL.Query().Get("requestId"))
	}
	sessID := strings.TrimSpace(r.Header.Get("X-Session-Id"))
	if sessID == "" {
		sessID = "stub-session"
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(connectAck{
		V:          1,
		Type:       "connect_ack",
		RequestID:  reqID,
		SessionID:  sessID,
		Ack:        true,
		Status:     "connected",
		ServerTime: time.Now().UTC().Format(time.RFC3339),
	})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"state": "idle",
	})
}

func handleDisconnect(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"state": "idle",
	})
}
