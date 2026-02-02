package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
)

func backendBase() string {
	addr := os.Getenv("BACKEND_ADDR")
	if addr == "" {
		addr = "127.0.0.1"
	}
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8790"
	}
	return "http://" + addr + ":" + port
}

func proxyJSONPost(w http.ResponseWriter, backendURL string, body []byte) {
	req, err := http.NewRequest(http.MethodPost, backendURL, bytes.NewReader(body))
	if err != nil {
		http.Error(w, "backend_unavailable", http.StatusBadGateway)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "backend_unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func proxyJSONGet(w http.ResponseWriter, backendURL string) {
	req, err := http.NewRequest(http.MethodGet, backendURL, nil)
	if err != nil {
		http.Error(w, "backend_unavailable", http.StatusBadGateway)
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "backend_unavailable", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

// ============================
// Phase 7: Messaging forwarders
// ============================

func handleMessageSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("X-User-Id")
	if userID == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	raw, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid_request_body", http.StatusBadRequest)
		return
	}

	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		http.Error(w, "invalid_json", http.StatusBadRequest)
		return
	}

	m["fromUserId"] = userID

	out, err := json.Marshal(m)
	if err != nil {
		http.Error(w, "invalid_json", http.StatusBadRequest)
		return
	}

	proxyJSONPost(w, backendBase()+"/message/send", out)
}

func handleMessageInbox(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	since := r.URL.Query().Get("since")

	backendURL := backendBase() + "/message/inbox"
	if since != "" {
		backendURL = backendURL + "?since=" + since
	}

	proxyJSONGet(w, backendURL)
}

// ============================
// Browsing B1: Preview forwarder
// ============================

func handleBrowsePreview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid_request_body", http.StatusBadRequest)
		return
	}

	proxyJSONPost(w, backendBase()+"/browse/preview", body)
}

// ============================
// Browsing B2: Sanitized fetch forwarder
// ============================

func handleBrowseFetch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "invalid_request_body", http.StatusBadRequest)
		return
	}

	proxyJSONPost(w, backendBase()+"/browse/fetch", body)
}
