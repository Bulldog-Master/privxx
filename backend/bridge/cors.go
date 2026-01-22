package main

import (
	"net/http"
	"strings"
)

// allowOrigin returns true if the browser Origin is allowed to call the bridge.
func allowOrigin(origin string) bool {
	// Exact allow-list
	switch origin {
	case "https://privxx.app",
		"https://www.privxx.app",
		"https://privxx.lovable.app":
		return true
	}

	// Suffix allow-list (Lovable preview domains)
	if strings.HasSuffix(origin, ".lovable.app") || strings.HasSuffix(origin, ".lovableproject.com") {
		return true
	}

	return false
}

// cors wraps the handler and:
// - Adds Access-Control-Allow-* for allowed origins
// - Answers preflight OPTIONS with 204 (so the real GET can proceed)
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && allowOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "authorization,content-type,apikey,x-request-id,x-user-id")
			w.Header().Set("Access-Control-Allow-Credentials", "false")
		}

		// Preflight: respond here (don’t fall through to /health JSON)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent) // 204
			return
		}

		next.ServeHTTP(w, r)
	})
}
