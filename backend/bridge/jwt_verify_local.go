package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
)

type jwks struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Use string `json:"use"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

var (
	jwksMu     sync.Mutex
	jwksCached jwks
	jwksExp    time.Time
)

// verifyJWTLocal verifies Supabase ES256 JWTs using the project's JWKS endpoint.
// NOTE: SUPABASE_ANON_KEY is NOT a signing secret for ES256; it's only useful for calling APIs.
func verifyJWTLocal(tokenStr string, _ string) (*JWTClaims, *JWTError) {
	tokenStr = strings.TrimSpace(tokenStr)
	if tokenStr == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "missing_token", Message: "Missing token"}
	}

	issExpected := strings.TrimRight(os.Getenv("SUPABASE_URL"), "/") + "/auth/v1"
	audExpected := os.Getenv("SUPABASE_JWT_AUD")
	if audExpected == "" {
		audExpected = "authenticated"
	}

	claims := jwt.MapClaims{}
	tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		// Enforce ES256
		if t.Method == nil || t.Method.Alg() != "ES256" {
			return nil, fmt.Errorf("unexpected alg: %v", t.Header["alg"])
		}
		kid, _ := t.Header["kid"].(string)
		if kid == "" {
			return nil, errors.New("missing kid")
		}
		return jwksPublicKeyByKID(kid)
	}, jwt.WithValidMethods([]string{"ES256"}), jwt.WithJSONNumber())

	if err != nil || tok == nil || !tok.Valid {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}

	// Extract MapClaims
	mc, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}
	claims = mc

	// Validate issuer
	if iss, _ := claims["iss"].(string); iss == "" || iss != issExpected {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}

	// Validate audience (Supabase typically uses string "authenticated")
	if aud, ok := claims["aud"].(string); ok {
		if aud != audExpected {
			return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
		}
	} else {
		// sometimes aud can be array; accept if contains expected
		if audArr, ok := claims["aud"].([]any); ok {
			found := false
			for _, v := range audArr {
				if s, ok := v.(string); ok && s == audExpected {
					found = true
					break
				}
			}
			if !found {
				return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
			}
		}
	}

	// Validate exp
	expOK := false
	switch v := claims["exp"].(type) {
	case json.Number:
		if n, e := v.Int64(); e == nil {
			expOK = time.Now().Unix() < n
		}
	case float64:
		expOK = time.Now().Unix() < int64(v)
	case int64:
		expOK = time.Now().Unix() < v
	}
	if !expOK {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}

	// Extract sub
	sub, _ := claims["sub"].(string)
	if strings.TrimSpace(sub) == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}

	// Your middleware only needs claims.Sub to be non-empty.
	out := &JWTClaims{}
	out.Sub = sub
	return out, nil
}

func jwksPublicKeyByKID(kid string) (*ecdsa.PublicKey, error) {
	// Cache JWKS for 10 minutes.
	jwksMu.Lock()
	useCache := time.Now().Before(jwksExp) && len(jwksCached.Keys) > 0
	jwksMu.Unlock()

	if !useCache {
		// Use existing jwksURL() in auth_supabase_endpoint.go (returns 1 string).
		u := jwksURL()
		if strings.TrimSpace(u) == "" {
			// Fallback if that function returns empty.
			base := strings.TrimRight(strings.TrimSpace(os.Getenv("SUPABASE_URL")), "/")
			if base == "" {
				return nil, errors.New("SUPABASE_URL not set")
			}
			u = base + "/auth/v1/.well-known/jwks.json"
		}

		j, err := fetchJWKS(u)
		if err != nil {
			return nil, err
		}
		jwksMu.Lock()
		jwksCached = j
		jwksExp = time.Now().Add(10 * time.Minute)
		jwksMu.Unlock()
	}

	jwksMu.Lock()
	defer jwksMu.Unlock()

	for _, k := range jwksCached.Keys {
		if k.Kid != kid {
			continue
		}
		if k.Kty != "EC" || k.Crv != "P-256" || k.Alg != "ES256" {
			return nil, fmt.Errorf("unsupported jwk: kty=%s crv=%s alg=%s", k.Kty, k.Crv, k.Alg)
		}
		x, err := b64urlToBigInt(k.X)
		if err != nil {
			return nil, err
		}
		y, err := b64urlToBigInt(k.Y)
		if err != nil {
			return nil, err
		}
		return &ecdsa.PublicKey{Curve: elliptic.P256(), X: x, Y: y}, nil
	}

	return nil, fmt.Errorf("kid not found in jwks: %s", kid)
}

func fetchJWKS(url string) (jwks, error) {
	req, _ := http.NewRequest("GET", url, nil)
	// JWKS is public, but some gateways behave better with apikey header present.
	if ak := strings.TrimSpace(os.Getenv("SUPABASE_ANON_KEY")); ak != "" {
		req.Header.Set("apikey", ak)
		req.Header.Set("Authorization", "Bearer "+ak)
	}

	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return jwks{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return jwks{}, fmt.Errorf("jwks fetch failed: %s", resp.Status)
	}

	var out jwks
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return jwks{}, err
	}
	if len(out.Keys) == 0 {
		return jwks{}, errors.New("jwks empty")
	}
	return out, nil
}

func b64urlToBigInt(s string) (*big.Int, error) {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	return new(big.Int).SetBytes(b), nil
}
