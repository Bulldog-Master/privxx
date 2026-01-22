package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type jwkSet struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

type jwksCache struct {
	mu      sync.RWMutex
	fetched time.Time
	ttl     time.Duration
	byKid   map[string]*ecdsa.PublicKey
}

var supabaseJWKS = &jwksCache{
	ttl:   1 * time.Hour,
	byKid: map[string]*ecdsa.PublicKey{},
}

func b64urlRawDecode(s string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(s)
}

func jwtHeader(token string) (map[string]any, *JWTError) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token format invalid"}
	}
	b, err := b64urlRawDecode(parts[0])
	if err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token header invalid"}
	}
	var h map[string]any
	if err := json.Unmarshal(b, &h); err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token header invalid"}
	}
	return h, nil
}

func jwtPayload(token string) (map[string]any, *JWTError) {
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token format invalid"}
	}
	b, err := b64urlRawDecode(parts[1])
	if err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token payload invalid"}
	}
	var p map[string]any
	if err := json.Unmarshal(b, &p); err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token payload invalid"}
	}
	return p, nil
}

func jwksURL() string {
	base := strings.TrimRight(os.Getenv("SUPABASE_URL"), "/")
	return base + "/auth/v1/.well-known/jwks.json"
}
func refreshJWKS(force bool) *JWTError {
	supabaseJWKS.mu.Lock()
	defer supabaseJWKS.mu.Unlock()

	if !force && time.Since(supabaseJWKS.fetched) < supabaseJWKS.ttl && len(supabaseJWKS.byKid) > 0 {
		return nil
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(jwksURL())
	if err != nil || resp.StatusCode != 200 {
		return &JWTError{Error: "unauthorized", Code: "verifier_unreachable", Message: "JWKS fetch failed"}
	}
	defer resp.Body.Close()

	var set jwkSet
	if err := json.NewDecoder(resp.Body).Decode(&set); err != nil {
		return &JWTError{Error: "unauthorized", Code: "verifier_unreachable", Message: "JWKS decode failed"}
	}

	keys := map[string]*ecdsa.PublicKey{}
	for _, k := range set.Keys {
		if k.Kty != "EC" || k.Crv != "P-256" {
			continue
		}
		xb, err1 := b64urlRawDecode(k.X)
		yb, err2 := b64urlRawDecode(k.Y)
		if err1 != nil || err2 != nil {
			continue
		}
		pub := &ecdsa.PublicKey{
			Curve: elliptic.P256(),
			X:     new(big.Int).SetBytes(xb),
			Y:     new(big.Int).SetBytes(yb),
		}
		if pub.X == nil || pub.Y == nil {
			continue
		}
		keys[k.Kid] = pub
	}

	if len(keys) == 0 {
		return &JWTError{Error: "unauthorized", Code: "verifier_unreachable", Message: "No valid JWKS keys"}
	}

	supabaseJWKS.byKid = keys
	supabaseJWKS.fetched = time.Now()
	return nil
}
func verifyJWTWithSupabase(token string) (*JWTClaims, *JWTError) {
	base := strings.TrimSpace(os.Getenv("SUPABASE_URL"))
	if base == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "verifier_not_configured", Message: "SUPABASE_URL missing"}
	}
	if strings.TrimSpace(token) == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "missing_token", Message: "Authorization Bearer token required"}
	}

	h, jerr := jwtHeader(token)
	if jerr != nil {
		return nil, jerr
	}

	alg, _ := h["alg"].(string)
	if alg != "ES256" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Unsupported JWT alg"}
	}
	kid, _ := h["kid"].(string)
	if kid == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Missing kid"}
	}

	// Ensure we have keys cached
	if err := refreshJWKS(false); err != nil {
		return nil, err
	}

	supabaseJWKS.mu.RLock()
	pub := supabaseJWKS.byKid[kid]
	supabaseJWKS.mu.RUnlock()

	// If kid not found, force refresh once (rotation)
	if pub == nil {
		_ = refreshJWKS(true)
		supabaseJWKS.mu.RLock()
		pub = supabaseJWKS.byKid[kid]
		supabaseJWKS.mu.RUnlock()
		if pub == nil {
			return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Unknown signing key"}
		}
	}

	parts := strings.Split(strings.TrimSpace(token), ".")
	signingInput := []byte(parts[0] + "." + parts[1])

	sig, err := b64urlRawDecode(parts[2])
	if err != nil || len(sig) != 64 {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Signature invalid"}
	}
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:])

	hash := sha256.Sum256(signingInput)
	if !ecdsa.Verify(pub, hash[:], r, s) {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Signature invalid"}
	}

	p, jerr := jwtPayload(token)
	if jerr != nil {
		return nil, jerr
	}

	// iss check (defensive)
	iss, _ := p["iss"].(string)
	wantIss := strings.TrimRight(base, "/") + "/auth/v1"
	if iss != "" && iss != wantIss {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Issuer mismatch"}
	}

	// exp check
	if expv, ok := p["exp"]; ok {
		exp, err := asInt64(expv)
		if err != nil || time.Now().Unix() >= exp {
			return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
		}
	}

	sub, _ := p["sub"].(string)
	if sub == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Missing sub"}
	}

	claims := &JWTClaims{Sub: sub}
	if email, _ := p["email"].(string); email != "" {
		claims.Email = email
	}
	if aud, _ := p["aud"].(string); aud != "" {
		claims.Aud = aud
	}
	return claims, nil
}
