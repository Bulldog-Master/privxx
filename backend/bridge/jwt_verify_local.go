package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/json"
	"strings"
	"time"
)

// verifyJWTLocal verifies an HS256 JWT using a shared secret.
// Uses helpers already defined in auth_local.go: b64urlDecode + asInt64.
func verifyJWTLocal(token string, secret string) (*JWTClaims, *JWTError) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "missing_token", Message: "Missing token"}
	}
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token format invalid"}
	}
	if strings.TrimSpace(secret) == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Verifier not configured"}
	}

	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	wantSig := mac.Sum(nil)

	gotSig, err := b64urlDecode(parts[2])
	if err != nil || !hmac.Equal(gotSig, wantSig) {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token is invalid or expired"}
	}

	pB, err := b64urlDecode(parts[1])
	if err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token payload is invalid"}
	}

	var raw map[string]any
	if err := json.Unmarshal(pB, &raw); err != nil {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token payload is invalid"}
	}

	sub, _ := raw["sub"].(string)
	if sub == "" {
		return nil, &JWTError{Error: "unauthorized", Code: "invalid_token", Message: "Token missing sub"}
	}

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
