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

// authMiddleware validates JWT for protected routes
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, jwtErr := validateJWT(r)
		if jwtErr != nil {
			writeJWTError(w, jwtErr)
			return
		}

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

// handleHealth returns bridge health status
func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	resp := HealthResponse{
		Status:    "ok",
		Version:   "0.2.0",
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

	// /health is public (no auth required)
	http.HandleFunc("/health", corsMiddleware(handleHealth))
	// All other routes require JWT authentication
	http.HandleFunc("/connect", corsMiddleware(authMiddleware(handleConnect)))
	http.HandleFunc("/status", corsMiddleware(authMiddleware(handleStatus)))
	http.HandleFunc("/disconnect", corsMiddleware(authMiddleware(handleDisconnect)))

	listenAddr := fmt.Sprintf("%s:%s", bindAddr, port)

	log.Printf("Privxx Bridge v0.2.0 starting on %s", listenAddr)
	log.Printf("Endpoints: /health, /connect, /status, /disconnect")
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
