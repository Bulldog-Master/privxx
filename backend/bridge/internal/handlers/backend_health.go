package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/backend"
)

// BackendHealthHandler returns a handler that probes backend /health and reports result.
// NOTE:
// - Code-only
// - NOT registered to any router yet
// - Safe to compile only; no runtime change
func BackendHealthHandler(cfg *backend.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c := backend.NewFromConfig(cfg)

		resp, err := c.Health(r.Context())
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadGateway)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"ok":    false,
				"error": err.Error(),
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":     true,
			"status": resp.Status,
			"stub":   resp.Stub,
		})
	}
}
