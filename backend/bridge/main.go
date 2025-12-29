// Privxx Bridge - Phase D Local Companion Service
// This service wraps xxDK and exposes HTTP endpoints for the UI.
//
// Run with: go run main.go
// Default port: 8090
//
// CORS: Enforces canonical origin (https://privxx.app)

package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
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

// ConnectRequest is the payload for POST /connect
type ConnectRequest struct {
	TargetURL string `json:"targetUrl"`
}

// ConnectResponse is returned from POST /connect
type ConnectResponse struct {
	Success   bool   `json:"success"`
	SessionID string `json:"sessionId,omitempty"`
	Error     string `json:"error,omitempty"`
}

// StatusResponse is returned from GET /status
type StatusResponse struct {
	State     SessionState `json:"state"`
	TargetURL string       `json:"targetUrl,omitempty"`
	SessionID string       `json:"sessionId,omitempty"`
	Latency   int64        `json:"latency,omitempty"` // milliseconds
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

// JWTClaims represents the claims we validate from Supabase JWT
type JWTClaims struct {
	Sub string `json:"sub"` // User ID
	Aud string `json:"aud"` // Audience
	Iss string `json:"iss"` // Issuer
	Exp int64  `json:"exp"` // Expiration time
	Iat int64  `json:"iat"` // Issued at
}

// JWTError response for auth failures
type JWTError struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message,omitempty"`
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

// AllowedOrigins for CORS (production + development)
var allowedOrigins = []string{
	"https://privxx.app",
	"https://www.privxx.app",
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

// verifyJWTSignature performs HMAC-SHA256 signature verification
func verifyJWTSignature(tokenString string, secret []byte) error {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return fmt.Errorf("invalid token format")
	}

	// Create the signing input (header.payload)
	signingInput := parts[0] + "." + parts[1]

	// Decode the signature from the token
	providedSig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		// Try with padding
		sig := parts[2]
		switch len(sig) % 4 {
		case 2:
			sig += "=="
		case 3:
			sig += "="
		}
		providedSig, err = base64.URLEncoding.DecodeString(sig)
		if err != nil {
			return fmt.Errorf("failed to decode signature: %v", err)
		}
	}

	// Compute expected signature using HMAC-SHA256
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(signingInput))
	expectedSig := mac.Sum(nil)

	// Constant-time comparison to prevent timing attacks
	if !hmac.Equal(providedSig, expectedSig) {
		return fmt.Errorf("signature verification failed")
	}

	return nil
}

// extractJWTClaims extracts and validates claims from a JWT token
func extractJWTClaims(tokenString string) (*JWTClaims, error) {
	// JWT format: header.payload.signature
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// Decode payload (second part)
	payload := parts[1]
	// Add padding if needed for base64 decoding
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}

	decoded, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		// Try standard encoding
		decoded, err = base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, fmt.Errorf("failed to decode payload: %v", err)
		}
	}

	var claims JWTClaims
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse claims: %v", err)
	}

	return &claims, nil
}

// validateJWT validates the JWT token from the Authorization header
// with full HMAC-SHA256 signature verification
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

	// Verify signature using SUPABASE_JWT_SECRET
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret == "" {
		log.Printf("[JWT] CRITICAL: SUPABASE_JWT_SECRET not configured")
		return nil, &JWTError{
			Error:   "server_error",
			Code:    "missing_secret",
			Message: "Server misconfiguration",
		}
	}

	// Verify HMAC-SHA256 signature
	if err := verifyJWTSignature(token, []byte(jwtSecret)); err != nil {
		log.Printf("[JWT] Signature verification failed: %v", err)
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_signature",
			Message: "Token signature invalid",
		}
	}

	claims, err := extractJWTClaims(token)
	if err != nil {
		log.Printf("[JWT] Parse error: %v", err)
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_token",
			Message: "Failed to parse token",
		}
	}

	// Validate expiration
	now := time.Now().Unix()
	if claims.Exp > 0 && claims.Exp < now {
		log.Printf("[JWT] Token expired: exp=%d, now=%d, diff=%ds", claims.Exp, now, now-claims.Exp)
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "token_expired",
			Message: "Token has expired",
		}
	}

	// Validate issued at (reject tokens issued in the future)
	if claims.Iat > 0 && claims.Iat > now+60 { // 60 second clock skew tolerance
		log.Printf("[JWT] Token issued in future: iat=%d, now=%d", claims.Iat, now)
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_iat",
			Message: "Token issued in the future",
		}
	}

	// Validate subject (user ID) exists
	if claims.Sub == "" {
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "missing_sub",
			Message: "Token missing subject claim",
		}
	}

	// Validate issuer (should be Supabase)
	expectedIssuer := os.Getenv("JWT_ISSUER")
	if expectedIssuer == "" {
		expectedIssuer = "https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1"
	}
	if claims.Iss != "" && claims.Iss != expectedIssuer {
		log.Printf("[JWT] Invalid issuer: got=%s, expected=%s", claims.Iss, expectedIssuer)
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_issuer",
			Message: "Token issuer mismatch",
		}
	}

	// Validate audience (should be "authenticated")
	expectedAud := os.Getenv("JWT_AUDIENCE")
	if expectedAud == "" {
		expectedAud = "authenticated"
	}
	if claims.Aud != "" && claims.Aud != expectedAud {
		log.Printf("[JWT] Invalid audience: got=%s, expected=%s", claims.Aud, expectedAud)
		return nil, &JWTError{
			Error:   "unauthorized",
			Code:    "invalid_audience",
			Message: "Token audience mismatch",
		}
	}

	log.Printf("[JWT] Valid token for user: %s (exp in %ds)", claims.Sub, claims.Exp-now)
	return claims, nil
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
	json.NewEncoder(w).Encode(resp)
}

// handleConnect initiates a cMixx connection
func handleConnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ConnectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ConnectResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	if req.TargetURL == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ConnectResponse{
			Success: false,
			Error:   "targetUrl is required",
		})
		return
	}

	// Update session state
	session.mu.Lock()
	session.State = StateConnecting
	session.TargetURL = req.TargetURL
	now := time.Now()
	session.StartedAt = &now
	session.mu.Unlock()

	// Privacy-preserving logging: only log domain, not full URL with parameters
	if parsedURL, err := url.Parse(req.TargetURL); err == nil {
		log.Printf("[CONNECT] Domain: %s", parsedURL.Host)
	} else {
		log.Printf("[CONNECT] Request received (URL parse error)")
	}

	// TODO: Replace with real xxDK/cMixx integration
	// For now, simulate connection delay
	go func() {
		time.Sleep(2 * time.Second) // Simulated cMixx handshake

		session.mu.Lock()
		defer session.mu.Unlock()

		// TODO: Actual cMixx message send/receive here
		// msg := Message{Type: "connect", TargetURL: req.TargetURL, Timestamp: time.Now().Unix()}
		// response, err := cmix.Send(serverReceptionID, msg)

		// Simulated success
		session.State = StateSecure
		session.SessionID = fmt.Sprintf("sim-%d", time.Now().UnixNano())
		log.Printf("[SECURE] Session: %s", session.SessionID)
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ConnectResponse{
		Success: true,
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
