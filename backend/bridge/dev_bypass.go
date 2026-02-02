package main

import (
	"net/http"
	"os"
)

// devBypassAuthAndUnlock
// DEV ONLY helper to bypass Supabase JWT + unlock gating for local smoke tests.
// In production (ENVIRONMENT != development) this always returns 403.
func devBypassAuthAndUnlock(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if os.Getenv("ENVIRONMENT") != "development" {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		// Pretend auth
		userID := r.Header.Get("X-User-Id")
		if userID == "" {
			userID = "dev-user"
			r.Header.Set("X-User-Id", userID)
		}

		// Pretend unlock (create/refresh identity session)
		identityManager.unlock(userID)

		next(w, r)
	}
}
