package main

import (
	"context"
	"encoding/json"
	"net/http"
)

// ctxKey is a private type to avoid context key collisions
type ctxKey string

// userIDKey is where authMiddleware stores the Supabase user id (sub)
const userIDKey ctxKey = "userID"

// getUserIDFromContext fetches the user id from request context
func getUserIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(userIDKey).(string)
	return id, ok
}

// writeJSON writes a JSON response with status code
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
