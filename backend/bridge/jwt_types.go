package main

// JWTClaims is the minimal set of claims we use.
// Keep it small and stable.
type JWTClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email,omitempty"`
	Aud   string `json:"aud,omitempty"`
}

// JWTError is our structured auth error payload.
type JWTError struct {
	Error   string `json:"error"`             // "unauthorized", "server_error"
	Code    string `json:"code,omitempty"`    // "missing_token", "invalid_token", etc.
	Message string `json:"message,omitempty"` // human readable
}
