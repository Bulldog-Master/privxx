package handlers

import (
	"net/http"
)

// Admin backend health is HARD-DISABLED at code level.
// This endpoint is intentionally unreachable in production builds.
func BackendHealth(w http.ResponseWriter, r *http.Request) {
	http.NotFound(w, r)
}
