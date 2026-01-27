package main

import (
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

var backendHTTP = &http.Client{Timeout: 5 * time.Second}

// registerMessageRoutes wires /v1/message/* on the bridge and forwards to backend core.
func registerMessageRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/v1/message/send", proxyToBackend)
	mux.HandleFunc("/v1/message/inbox", proxyToBackend)
	mux.HandleFunc("/v1/message/thread", proxyToBackend)
	mux.HandleFunc("/v1/message/ack", proxyToBackend)
}

// proxyToBackend forwards the incoming request to BACKEND_ADDR (default http://127.0.0.1:8091).
func proxyToBackend(w http.ResponseWriter, r *http.Request) {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("BACKEND_ADDR")), "/")
	if base == "" {
		base = "http://127.0.0.1:8091"
	}

	// Preserve path + query exactly
	targetURL := base + r.URL.Path
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	var body io.Reader
	if r.Body != nil {
		defer r.Body.Close()
		body = r.Body
	}

	req, err := http.NewRequest(r.Method, targetURL, body)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Forward key headers (and keep Authorization for our middleware only)
	for _, h := range []string{"Content-Type", "X-User-Id", "X-Request-Id", "X-Session-Id"} {
		if v := r.Header.Get(h); v != "" {
			req.Header.Set(h, v)
		}
	}

	resp, err := backendHTTP.Do(req)
	if err != nil {
		http.Error(w, "backend unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy response headers (minimal set)
	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}
