// ============================================================
// PHASE 6 — LOCKED
//
// This file is part of Phase 6 (Real xxDK + cMixx readiness).
// DO NOT modify identity, auth, xxDK init, or health logic.
//
// Allowed changes only:
// - Phase 7+ features that CALL existing interfaces
//
// Architecture: Option A (server-owned xxDK identity)
//
// ============================================================

// Privxx Bridge - Phase D Local Companion Service
// This service wraps xxDK and exposes HTTP endpoints for the UI.
//
// Run with: go run main.go
// Default port: 8090
//
// CORS: Enforces canonical origin (https://privxx.app)

package main

import (
	"io"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

// Canonical origin for production
const CanonicalOrigin = "https://privxx.app"

// Session state
type SessionState string

const (
	StateIdle       SessionState = "idle"
	StateConnecting SessionState = "connecting"
	StateSecure     SessionState = "secure"
	StateError      SessionState = "error"
)

// Session holds the current connection state
type Session struct {
	mu        sync.RWMutex
	State     SessionState `json:"state"`
	TargetURL string       `json:"targetUrl,omitempty"`
	SessionID string       `json:"sessionId,omitempty"`
	Error     string       `json:"error,omitempty"`
	StartedAt *time.Time   `json:"startedAt,omitempty"`
}

var session = &Session{State: StateIdle}

// ConnectIntent is the payload for POST /connect (Phase D schema)
type ConnectIntent struct {
	V         int    `json:"v"`               // Schema version (Phase D: 1)
	Type      string `json:"type"`            // Must be "connect_intent"
	RequestID string `json:"requestId"`       // Unique request identifier
	SessionID string `json:"sessionId"`       // Session identifier
	TargetURL string `json:"targetUrl"`       // URL entered by user
	ClientTime string `json:"clientTime"`     // ISO timestamp
}

// ConnectAck is returned from POST /connect (Phase D schema)
type ConnectAck struct {
	V          int    `json:"v"`                       // Schema version (Phase D: 1)
	Type       string `json:"type"`                    // Always "connect_ack"
	RequestID  string `json:"requestId"`               // Must match intent
	SessionID  string `json:"sessionId"`               // Must match intent
	Ack        bool   `json:"ack"`                     // true = success
	Status     string `json:"status"`                  // "connected" or "error"
	ServerTime string `json:"serverTime,omitempty"`    // ISO timestamp
	ErrorCode  string `json:"errorCode,omitempty"`     // Error code if ack=false
}

// Phase D schema version
const PhaseDSchemaVersion = 1

// StatusResponse is returned from GET /status
type StatusResponse struct {
	State     SessionState `json:"state"`
	TargetURL string       `json:"targetUrl,omitempty"`
	SessionID string       `json:"sessionId,omitempty"`
	Latency   int64        `json:"latency,omitempty"` // milliseconds
	XXDKReady bool         `json:"xxdkReady"`
	Error     string       `json:"error,omitempty"`
}

// HealthResponse is returned from GET /health
type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	XXDKReady bool   `json:"xxdkReady"`
}

// IdentitySession represents an unlocked user identity session
type IdentitySession struct {
	UserID       string    `json:"userId"`
	XXIdentityID string    `json:"-"` // Never exposed to frontend
	UnlockedAt   time.Time `json:"unlockedAt"`
	ExpiresAt    time.Time `json:"expiresAt"`
	LastActivity time.Time `json:"lastActivity"`
}

// IdentityManager manages user identity sessions with TTL
type IdentityManager struct {
	mu       sync.RWMutex
	sessions map[string]*IdentitySession // keyed by userID
	ttl      time.Duration
}

// Default TTL: 15 minutes (configurable via UNLOCK_TTL_MINUTES env var)
var identityManager = &IdentityManager{
	sessions: make(map[string]*IdentitySession),
	ttl:      15 * time.Minute,
}

// UnlockRequest is the payload for POST /unlock
type UnlockRequest struct {
	// Future: could include passphrase or biometric confirmation
}

// UnlockResponse is returned from POST /unlock
type UnlockResponse struct {
	Success   bool      `json:"success"`
	ExpiresAt time.Time `json:"expiresAt,omitempty"`
	TTL       int       `json:"ttlSeconds,omitempty"`
	Error     string    `json:"error,omitempty"`
}

// LockResponse is returned from POST /lock
type LockResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// UnlockStatusResponse is returned from GET /unlock/status
type UnlockStatusResponse struct {
	Unlocked     bool      `json:"unlocked"`
	ExpiresAt    time.Time `json:"expiresAt,omitempty"`
	TTLRemaining int       `json:"ttlRemainingSeconds,omitempty"`
}

// isUnlocked checks if user has an active unlocked session
func (im *IdentityManager) isUnlocked(userID string) bool {
	im.mu.RLock()
	defer im.mu.RUnlock()

	session, exists := im.sessions[userID]
	if !exists {
		return false
	}

	return time.Now().Before(session.ExpiresAt)
}

// getSession returns the session if unlocked and valid
func (im *IdentityManager) getSession(userID string) (*IdentitySession, bool) {
	im.mu.RLock()
	defer im.mu.RUnlock()

	session, exists := im.sessions[userID]
	if !exists {
		return nil, false
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, false
	}

	return session, true
}

// unlock creates or refreshes an unlocked session for a user
func (im *IdentityManager) unlock(userID string) *IdentitySession {
	im.mu.Lock()
	defer im.mu.Unlock()

	now := time.Now()
	expiresAt := now.Add(im.ttl)

	session, exists := im.sessions[userID]
	if exists {
		// Refresh existing session
		session.UnlockedAt = now
		session.ExpiresAt = expiresAt
		session.LastActivity = now
		log.Printf("[IDENTITY] Session refreshed for user %s (expires %s)", userID, expiresAt.Format(time.RFC3339))
	} else {
		// Create new session
		// TODO: In real implementation, create or retrieve XX identity here
		xxIdentityID := fmt.Sprintf("xx-id-%s-%d", userID[:8], now.UnixNano())
		
		session = &IdentitySession{
			UserID:       userID,
			XXIdentityID: xxIdentityID,
			UnlockedAt:   now,
			ExpiresAt:    expiresAt,
			LastActivity: now,
		}
		im.sessions[userID] = session
		log.Printf("[IDENTITY] New session created for user %s (XX ID: %s, expires %s)", 
			userID, xxIdentityID, expiresAt.Format(time.RFC3339))
	}

	return session
}

// lock immediately locks a user's session
func (im *IdentityManager) lock(userID string) bool {
	im.mu.Lock()
	defer im.mu.Unlock()

	_, exists := im.sessions[userID]
	if exists {
		delete(im.sessions, userID)
		log.Printf("[IDENTITY] Session locked for user %s", userID)
		return true
	}
	return false
}

// touchActivity updates last activity time and optionally extends TTL
func (im *IdentityManager) touchActivity(userID string) {
	im.mu.Lock()
	defer im.mu.Unlock()

	session, exists := im.sessions[userID]
	if exists && time.Now().Before(session.ExpiresAt) {
		session.LastActivity = time.Now()
		// Optional: extend TTL on activity (sliding window)
		// session.ExpiresAt = time.Now().Add(im.ttl)
	}
}

// cleanup removes expired sessions
func (im *IdentityManager) cleanup() {
	im.mu.Lock()
	defer im.mu.Unlock()

	now := time.Now()
	for userID, session := range im.sessions {
		if now.After(session.ExpiresAt) {
			delete(im.sessions, userID)
			log.Printf("[IDENTITY] Expired session cleaned up for user %s", userID)
		}
	}
}

// startCleanupRoutine periodically cleans up expired sessions
func (im *IdentityManager) startCleanupRoutine() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			im.cleanup()
		}
	}()
}

// JWTClaims represents the user data returned from Supabase /auth/v1/user
type JWTClaims struct {
	Sub   string `json:"id"`    // User ID (mapped from "id" in response)
	Email string `json:"email"` // User email
	Aud   string `json:"aud"`   // Audience
}

// SupabaseUserResponse represents the full response from /auth/v1/user
type SupabaseUserResponse struct {
	ID               string `json:"id"`
	Email            string `json:"email"`
	EmailConfirmedAt string `json:"email_confirmed_at"`
	Aud              string `json:"aud"`
	Role             string `json:"role"`
}

// RateLimitConfig holds rate limiting configuration
type RateLimitConfig struct {
	MaxAttempts    int           // Max failed attempts before lockout
	WindowDuration time.Duration // Time window for counting attempts
	LockoutDuration time.Duration // How long to block after exceeding limit
}

// RateLimitEntry tracks attempts for a single IP
type RateLimitEntry struct {
	Attempts    int
	FirstAttempt time.Time
	LockedUntil  time.Time
}

// RateLimiter manages IP-based rate limiting
type RateLimiter struct {
	mu      sync.RWMutex
	entries map[string]*RateLimitEntry
	config  RateLimitConfig
}

// Default rate limit: 10 failed attempts per 15 minutes, 30 minute lockout
var rateLimiter = &RateLimiter{
	entries: make(map[string]*RateLimitEntry),
	config: RateLimitConfig{
		MaxAttempts:     10,
		WindowDuration:  15 * time.Minute,
		LockoutDuration: 30 * time.Minute,
	},
}

// getClientIP extracts the client IP from the request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (for reverse proxies)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the chain
		if idx := strings.Index(xff, ","); idx != -1 {
			return strings.TrimSpace(xff[:idx])
		}
		return strings.TrimSpace(xff)
	}
	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		return ip[:idx]
	}
	return ip
}

// isRateLimited checks if an IP is currently rate limited
func (rl *RateLimiter) isRateLimited(ip string) (bool, time.Duration) {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	entry, exists := rl.entries[ip]
	if !exists {
		return false, 0
	}

	now := time.Now()

	// Check if currently locked out
	if !entry.LockedUntil.IsZero() && now.Before(entry.LockedUntil) {
		remaining := entry.LockedUntil.Sub(now)
		return true, remaining
	}

	return false, 0
}

// recordFailedAttempt records a failed auth attempt for an IP
func (rl *RateLimiter) recordFailedAttempt(ip string) (blocked bool, remaining time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	entry, exists := rl.entries[ip]

	if !exists {
		rl.entries[ip] = &RateLimitEntry{
			Attempts:     1,
			FirstAttempt: now,
		}
		return false, 0
	}

	// If window has expired, reset
	if now.Sub(entry.FirstAttempt) > rl.config.WindowDuration {
		entry.Attempts = 1
		entry.FirstAttempt = now
		entry.LockedUntil = time.Time{}
		return false, 0
	}

	// Increment attempts
	entry.Attempts++

	// Check if we should lock out
	if entry.Attempts >= rl.config.MaxAttempts {
		entry.LockedUntil = now.Add(rl.config.LockoutDuration)
		log.Printf("[RATE-LIMIT] IP %s locked out until %s (%d attempts)", 
			ip, entry.LockedUntil.Format(time.RFC3339), entry.Attempts)
		return true, rl.config.LockoutDuration
	}

	return false, 0
}

// recordSuccess clears rate limit state for an IP on successful auth
func (rl *RateLimiter) recordSuccess(ip string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	delete(rl.entries, ip)
}

// cleanup removes expired entries (call periodically)
func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for ip, entry := range rl.entries {
		// Remove if window expired and not locked
		windowExpired := now.Sub(entry.FirstAttempt) > rl.config.WindowDuration
		lockExpired := entry.LockedUntil.IsZero() || now.After(entry.LockedUntil)
		
		if windowExpired && lockExpired {
			delete(rl.entries, ip)
		}
	}
}

// startCleanupRoutine starts a goroutine to periodically clean up expired entries
func (rl *RateLimiter) startCleanupRoutine() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			rl.cleanup()
		}
	}()
}

// AllowedOrigins for CORS (production + development + Lovable preview)
var allowedOrigins = []string{
	"https://privxx.app",
	"https://www.privxx.app",
	"https://privxx.lovable.app", // Explicit Lovable preview domain
}

// AllowedOriginSuffixes for Lovable preview domains
var allowedOriginSuffixes = []string{
	".lovable.app",
	".lovableproject.com",
}

// isAllowedOrigin checks if the origin is permitted
func isAllowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}

	// Check environment for development mode
	if os.Getenv("ENVIRONMENT") == "development" {
		return true
	}

	// Check exact matches
	for _, allowed := range allowedOrigins {
		if origin == allowed {
			return true
		}
	}

	// Check suffix matches (Lovable preview domains)
	for _, suffix := range allowedOriginSuffixes {
		// Parse origin to get hostname
		if parsed, err := url.Parse(origin); err == nil {
			if strings.HasSuffix(parsed.Host, suffix) && strings.HasPrefix(origin, "https://") {
				return true
			}
		}
	}

	return false
}

// JWTError response for auth failures
type JWTError struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message,omitempty"`
}

// Backend configuration (provided at runtime via environment variables)
var (
	supabaseURL     string
	supabaseAnonKey string
)

func init() {
	supabaseURL = strings.TrimSpace(os.Getenv("SUPABASE_URL"))
	supabaseAnonKey = strings.TrimSpace(os.Getenv("SUPABASE_ANON_KEY"))

	if supabaseURL == "" {
		log.Fatal("[CONFIG] SUPABASE_URL is required")
	}
	if supabaseAnonKey == "" {
		log.Fatal("[CONFIG] SUPABASE_ANON_KEY is required")
	}
}

// HTTP client with timeout for Supabase API calls
var httpClient = &http.Client{
	Timeout: 10 * time.Second,
}

// validateJWTViaEndpoint validates a JWT by calling Supabase /auth/v1/user
// This is the endpoint-based verification approach that doesn't require the JWT secret
func validateJWTViaEndpoint(token string) (*JWTClaims, *JWTError) {
	// Build request to Supabase auth endpoint
	authURL := supabaseURL + "/auth/v1/user"
	
	req, err := http.NewRequest("GET", authURL, nil)
	if err != nil {
		log.Printf("[JWT] Failed to create request: %v", err)
		return nil, &JWTError{
			Error:   "server_error",
			Code:    "request_failed",
			Message: "Internal server error",
		}
	}

	// Required headers for Supabase API
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", supabaseAnonKey)
	req.Header.Set("Content-Type", "application/json")

	// Make the request
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Printf("[JWT] Supabase API request failed: %v", err)
		return nil, &JWTError{
			Error:   "server_error",
			Code:    "supabase_unreachable",
			Message: "Unable to verify token",
		}
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[JWT] Failed to read response: %v", err)
		return nil, &JWTError{
			Error:   "server_error",
			Code:    "response_error",
			Message: "Failed to read verification response",
		}
	}

	// Handle non-200 responses
	if resp.StatusCode != http.StatusOK {
		log.Printf("[JWT] Supabase returned %d: %s", resp.StatusCode, string(body))
		
		if resp.StatusCode == http.StatusUnauthorized {
			return nil, &JWTError{
				Error:   "unauthorized",
				Code:    "invalid_token",
				Message: "Token is invalid or expired",
			}
		}
		
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "verification_failed",
			Message: "Token verification failed",
		}
	}

	// Parse user response
	var user SupabaseUserResponse
	if err := json.Unmarshal(body, &user); err != nil {
		log.Printf("[JWT] Failed to parse user response: %v", err)
		return nil, &JWTError{
			Error:   "server_error",
			Code:    "parse_error",
			Message: "Failed to parse user data",
		}
	}

	// Validate user ID exists
	if user.ID == "" {
		log.Printf("[JWT] User response missing ID")
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_user",
			Message: "Invalid user data",
		}
	}

	log.Printf("[JWT] Token verified via Supabase endpoint for user: %s (%s)", user.ID, user.Email)
	
	return &JWTClaims{
		Sub:   user.ID,
		Email: user.Email,
		Aud:   user.Aud,
	}, nil
}

// validateJWT validates the JWT token from the Authorization header
// Uses Supabase /auth/v1/user endpoint for verification (no local secret required)
func validateJWT(r *http.Request) (*JWTClaims, *JWTError) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "missing_token",
			Message: "Authorization header required",
		}
	}

	// Expect "Bearer <token>"
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_format",
			Message: "Authorization header must be Bearer token",
		}
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == "" {
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "empty_token",
			Message: "Token is empty",
		}
	}

	// Verify token via Supabase endpoint
	return validateJWTViaEndpoint(token)
}

// writeJWTError writes a JSON error response for JWT validation failures
func writeJWTError(w http.ResponseWriter, jwtErr *JWTError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(jwtErr)
}

// authMiddleware validates JWT for protected routes with rate limiting
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := getClientIP(r)

		// Check if IP is rate limited
		if limited, remaining := rateLimiter.isRateLimited(clientIP); limited {
			log.Printf("[RATE-LIMIT] Blocked request from %s (locked for %v)", clientIP, remaining)
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", fmt.Sprintf("%d", int(remaining.Seconds())))
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":   "rate_limited",
				"code":    "too_many_requests",
				"message": fmt.Sprintf("Too many failed attempts. Try again in %d seconds.", int(remaining.Seconds())),
				"retryAfter": int(remaining.Seconds()),
			})
			return
		}

		claims, jwtErr := validateJWT(r)
		if jwtErr != nil {
			// Record failed attempt
			blocked, remaining := rateLimiter.recordFailedAttempt(clientIP)
			if blocked {
				jwtErr.Message = fmt.Sprintf("Account locked due to too many failed attempts. Try again in %d seconds.", int(remaining.Seconds()))
				jwtErr.Code = "rate_limited"
			}
			writeJWTError(w, jwtErr)
			return
		}

		// Clear rate limit on successful auth
		rateLimiter.recordSuccess(clientIP)

		// Add user ID to request context via header for downstream handlers
		r.Header.Set("X-User-Id", claims.Sub)
		next(w, r)
	}
}

// corsMiddleware enforces canonical origin CORS policy
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Set CORS headers based on origin validation
		if isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
		} else if origin != "" {
			// Log rejected origins for debugging (no sensitive data)
			log.Printf("[CORS] Rejected origin: %s", origin)
			// Return canonical origin (will fail CORS for unauthorized)
			w.Header().Set("Access-Control-Allow-Origin", CanonicalOrigin)
		} else {
			// No origin header (direct request, not browser CORS)
			w.Header().Set("Access-Control-Allow-Origin", CanonicalOrigin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Correlation-Id, X-Client-Info")
		w.Header().Set("Access-Control-Max-Age", "86400") // Cache preflight for 24 hours

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

// unlockRequiredMiddleware ensures user has an active unlocked session
func unlockRequiredMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("X-User-Id")
		if userID == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error":   "unauthorized",
				"code":    "missing_user_id",
				"message": "User ID not found in request",
			})
			return
		}

		if !identityManager.isUnlocked(userID) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{
				"error":   "forbidden",
				"code":    "session_locked",
				"message": "Identity session is locked. Call POST /unlock first.",
			})
			return
		}

		// Update activity timestamp
		identityManager.touchActivity(userID)
		next(w, r)
	}
}

// handleUnlock unlocks the user's identity session
func handleUnlock(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(UnlockResponse{
			Success: false,
			Error:   "User ID not found",
		})
		return
	}

	session := identityManager.unlock(userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UnlockResponse{
		Success:   true,
		ExpiresAt: session.ExpiresAt,
		TTL:       int(time.Until(session.ExpiresAt).Seconds()),
	})
}

// handleLock immediately locks the user's identity session
func handleLock(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LockResponse{
			Success: false,
			Error:   "User ID not found",
		})
		return
	}

	identityManager.lock(userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(LockResponse{
		Success: true,
	})
}

// handleUnlockStatus returns the current unlock status
func handleUnlockStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "User ID not found",
		})
		return
	}

	session, unlocked := identityManager.getSession(userID)

	w.Header().Set("Content-Type", "application/json")
	if unlocked {
		json.NewEncoder(w).Encode(UnlockStatusResponse{
			Unlocked:     true,
			ExpiresAt:    session.ExpiresAt,
			TTLRemaining: int(time.Until(session.ExpiresAt).Seconds()),
		})
	} else {
		json.NewEncoder(w).Encode(UnlockStatusResponse{
			Unlocked: false,
		})
	}
}

// handleHealth returns bridge health status
func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	resp := HealthResponse{
		Status:    "ok",
		Version:   "0.4.0",
		XXDKReady: false, // TODO: Check actual xxDK status
	}

	w.Header().Set("Content-Type", "application/json")
	
        // Option B: backend-owned xxDK readiness (health)
        // Best-effort only: /health must still work if backend is down.
        backendAddr := os.Getenv("BACKEND_ADDR")
        if backendAddr == "" { backendAddr = "127.0.0.1" }
        backendPort := os.Getenv("BACKEND_PORT")
        if backendPort == "" { backendPort = "8790" }

        backendURL := fmt.Sprintf("http://%s:%s/health", backendAddr, backendPort)
        if req, err := http.NewRequest("GET", backendURL, nil); err == nil {
                if r2, err := httpClient.Do(req); err == nil {
                        defer r2.Body.Close()
                        if r2.StatusCode == http.StatusOK {
                                var tmp struct { XXDKReady bool `json:"xxdkReady"` }
                                if json.NewDecoder(r2.Body).Decode(&tmp) == nil {
                                        resp.XXDKReady = tmp.XXDKReady
                                }
                        }
                }
        }

        json.NewEncoder(w).Encode(resp)
}

// handleConnect processes Phase D connect_intent and returns connect_ack
func handleConnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var intent ConnectIntent
	if err := json.NewDecoder(r.Body).Decode(&intent); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ConnectAck{
			V:         PhaseDSchemaVersion,
			Type:      "connect_ack",
			RequestID: "",
			SessionID: "",
			Ack:       false,
			Status:    "error",
			ErrorCode: "INVALID_MESSAGE",
			ServerTime: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Validate intent type
	if intent.Type != "connect_intent" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ConnectAck{
			V:         PhaseDSchemaVersion,
			Type:      "connect_ack",
			RequestID: intent.RequestID,
			SessionID: intent.SessionID,
			Ack:       false,
			Status:    "error",
			ErrorCode: "INVALID_MESSAGE",
			ServerTime: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Validate required fields
	if intent.TargetURL == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ConnectAck{
			V:         PhaseDSchemaVersion,
			Type:      "connect_ack",
			RequestID: intent.RequestID,
			SessionID: intent.SessionID,
			Ack:       false,
			Status:    "error",
			ErrorCode: "INVALID_URL",
			ServerTime: time.Now().UTC().Format(time.RFC3339),
		})
		return
	}

	// Update session state
	session.mu.Lock()
	session.State = StateConnecting
	session.TargetURL = intent.TargetURL
	session.SessionID = intent.SessionID
	now := time.Now()
	session.StartedAt = &now
	session.mu.Unlock()

	// Privacy-preserving logging: only log domain, not full URL with parameters
	if parsedURL, err := url.Parse(intent.TargetURL); err == nil {
		log.Printf("[CONNECT] Domain: %s, RequestID: %s", parsedURL.Host, intent.RequestID)
	} else {
		log.Printf("[CONNECT] Request received (URL parse error), RequestID: %s", intent.RequestID)
	}

	// TODO: Replace with real xxDK/cMixx integration
	// For now, simulate synchronous connection (Phase D)
	// In real implementation:
	// 1. Send connect_intent via cMixx
	// 2. Wait for connect_ack from server
	// 3. Return the ack to frontend
	
	// Simulated cMixx handshake delay (in production, this would be async)
	time.Sleep(500 * time.Millisecond)

	session.mu.Lock()
	session.State = StateSecure
	session.mu.Unlock()

	log.Printf("[SECURE] Session: %s, RequestID: %s", intent.SessionID, intent.RequestID)

	// Return successful connect_ack
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ConnectAck{
		V:         PhaseDSchemaVersion,
		Type:      "connect_ack",
		RequestID: intent.RequestID,
		SessionID: intent.SessionID,
		Ack:       true,
		Status:    "connected",
		ServerTime: time.Now().UTC().Format(time.RFC3339),
	})
}

// handleStatus returns current session status
func handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	session.mu.RLock()
	resp := StatusResponse{
		State:     session.State,
		TargetURL: session.TargetURL,
		SessionID: session.SessionID,
		Error:     session.Error,
	}
	if session.StartedAt != nil && session.State == StateSecure {
		resp.Latency = time.Since(*session.StartedAt).Milliseconds()
	}
	session.mu.RUnlock()

	// Option B: backend-owned xxDK readiness (local-only).
	// Best-effort only: /status must still work if backend is down.
	backendAddr := os.Getenv("BACKEND_ADDR")
	if backendAddr == "" {
		backendAddr = "127.0.0.1"
	}
	backendPort := os.Getenv("BACKEND_PORT")
	if backendPort == "" {
		backendPort = "8790"
	}

	backendURL := fmt.Sprintf("http://%s:%s/health", backendAddr, backendPort)
	req, err := http.NewRequest("GET", backendURL, nil)
	if err == nil {
		r2, err := httpClient.Do(req)
		if err == nil {
			defer r2.Body.Close()
			if r2.StatusCode == http.StatusOK {
				body, _ := io.ReadAll(r2.Body)
				var tmp struct { XXDKReady bool `json:"xxdkReady"` }
				if json.Unmarshal(body, &tmp) == nil {
					resp.XXDKReady = tmp.XXDKReady
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// handleDisconnect resets the session
func handleDisconnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	session.mu.Lock()
	session.State = StateIdle
	session.TargetURL = ""
	session.SessionID = ""
	session.Error = ""
	session.StartedAt = nil
	session.mu.Unlock()

	log.Printf("[DISCONNECT] Session reset")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	// Bind to localhost only for security
	bindAddr := os.Getenv("BIND_ADDR")
	if bindAddr == "" {
		bindAddr = "127.0.0.1"
	}

	// Configure unlock TTL from environment
	if ttlMinutes := os.Getenv("UNLOCK_TTL_MINUTES"); ttlMinutes != "" {
		if minutes, err := time.ParseDuration(ttlMinutes + "m"); err == nil {
			identityManager.ttl = minutes
		}
	}

	// Start cleanup routines
	rateLimiter.startCleanupRoutine()
	identityManager.startCleanupRoutine()
	
	log.Printf("Rate limiter initialized: %d attempts per %v, %v lockout",
		rateLimiter.config.MaxAttempts,
		rateLimiter.config.WindowDuration,
		rateLimiter.config.LockoutDuration)
	log.Printf("Identity manager initialized: %v TTL", identityManager.ttl)

	// /health is public (no auth required)
	http.HandleFunc("/health", corsMiddleware(handleHealth))
	
	// Unlock/lock endpoints require auth but not unlock status
	http.HandleFunc("/unlock", corsMiddleware(authMiddleware(handleUnlock)))
	http.HandleFunc("/unlock/status", corsMiddleware(authMiddleware(handleUnlockStatus)))
	http.HandleFunc("/lock", corsMiddleware(authMiddleware(handleLock)))
	
	// Protected routes require both auth AND unlocked session
	http.HandleFunc("/connect", corsMiddleware(authMiddleware(unlockRequiredMiddleware(handleConnect))))
	http.HandleFunc("/status", corsMiddleware(authMiddleware(handleStatus))) // Status doesn't require unlock
	http.HandleFunc("/disconnect", corsMiddleware(authMiddleware(unlockRequiredMiddleware(handleDisconnect))))

	listenAddr := fmt.Sprintf("%s:%s", bindAddr, port)

	log.Printf("Privxx Bridge v0.4.0 starting on %s", listenAddr)
	log.Printf("Endpoints: /health, /unlock, /unlock/status, /lock, /connect, /status, /disconnect")
	log.Printf("CORS: Canonical origin %s", CanonicalOrigin)
	log.Printf("Allowed origins: %v", allowedOrigins)
	log.Printf("Allowed suffixes: %v", allowedOriginSuffixes)
	log.Printf("---")

	if os.Getenv("ENVIRONMENT") == "development" {
		log.Printf("WARNING: Running in development mode (all origins allowed)")
	}

	log.Printf("NOTE: xxDK integration is simulated. Replace TODO sections with real xxDK calls.")

	if err := http.ListenAndServe(listenAddr, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
