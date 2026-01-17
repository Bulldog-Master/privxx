package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

func validateJWTHS256(token string, secret string) (*JWTClaims, *JWTError) {
	if token == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "missing_token", Message: "Authorization header required"}
	}
	if secret == "" {
		return nil, &JWTError{Error: "server_error", Code: "missing_jwt_secret", Message: "SUPABASE_JWT_SECRET is required for local auth"}
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token format is invalid"}
	}

	hB, err := b64urlDecode(parts[0])
	if err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token header is invalid"}
	}
	var hdr struct {
		Alg string `json:"alg"`
		Typ string `json:"typ"`
	}
	if err := json.Unmarshal(hB, &hdr); err != nil || hdr.Alg != "HS256" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Unsupported token algorithm"}
	}

	// Verify signature: HMACSHA256(base64url(header)+"."+base64url(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(parts[0] + "." + parts[1]))
	wantSig := mac.Sum(nil)

	gotSig, err := b64urlDecode(parts[2])
	if err != nil || !hmac.Equal(gotSig, wantSig) {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}

	pB, err := b64urlDecode(parts[1])
	if err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token payload is invalid"}
	}

	// Minimal claims we need: sub (+ exp)
	var raw map[string]any
	if err := json.Unmarshal(pB, &raw); err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token payload is invalid"}
	}

	sub, _ := raw["sub"].(string)
	if sub == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token missing sub"}
	}

	// exp is optional but if present, enforce it
	if expv, ok := raw["exp"]; ok {
		exp, err := asInt64(expv)
		if err != nil {
			return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token exp is invalid"}
		}
		if time.Now().Unix() >= exp {
			return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
		}
	}

	claims := &JWTClaims{Sub: sub}
	if email, _ := raw["email"].(string); email != "" {
		claims.Email = email
	}
	if aud, _ := raw["aud"].(string); aud != "" {
		claims.Aud = aud
	}
	return claims, nil
}

func b64urlDecode(s string) ([]byte, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, errors.New("empty")
	}
	// raw URL encoding (no padding)
	return base64.RawURLEncoding.DecodeString(s)
}

func asInt64(v any) (int64, error) {
	switch t := v.(type) {
	case float64:
		return int64(t), nil
	case int64:
		return t, nil
	case int:
		return int64(t), nil
	case json.Number:
		return t.Int64()
	default:
		return 0, errors.New("bad number")
	}
}
