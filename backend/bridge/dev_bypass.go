package main

import (
	"net/http"
	"os"
)

// devBypassAuthAndUnlock
// DEV ONLY helper to bypass Supabase JWT + unlock gating for local smoke tests.
//
// Behavior:
// - If ENVIRONMENT == "development": bypass auth+unlock (used on privxx-build for smoke tests)
// - Otherwise (prod): DO NOT bypass. Enforce Option A auth + unlock gating.
func devBypassAuthAndUnlock(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if os.Getenv("ENVIRONMENT") != "development" {
			// Production path: require JWT + unlocked identity
			authMiddleware(unlockRequiredMiddleware(next))(w, r)
			return
		}

		// Development path: bypass Supabase JWT + unlock gating
		userID := r.Header.Get("X-User-Id")
		if userID == "" {
			userID = "dev-user"
		}

		// Pretend unlock (create/refresh identity session)
		identityManager.unlock(userID)

		// Run handler
		next(w, r)
	}
}
