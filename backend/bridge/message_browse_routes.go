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

	proxyJSONPost(w, backendBase()+"/v1/messages/send", out)
}

func handleMessageInbox(w http.ResponseWriter, r *http.Request) {
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

	// Accept either an empty body or a JSON body from the client.
	// We always enforce v=1 and userId from auth.
	var m map[string]any
	if len(bytes.TrimSpace(raw)) > 0 {
		if err := json.Unmarshal(raw, &m); err != nil {
			http.Error(w, "invalid_json", http.StatusBadRequest)
			return
		}
	} else {
		m = make(map[string]any)
	}

	m["v"] = 1
	m["userId"] = userID
	if _, ok := m["conversationId"]; !ok {
		http.Error(w, "missing_conversation_id", http.StatusBadRequest)
		return
	}

	out, err := json.Marshal(m)
	if err != nil {
		http.Error(w, "invalid_json", http.StatusBadRequest)
		return
	}

	proxyJSONPost(w, backendBase()+"/v1/messages/inbox", out)
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

	proxyJSONPost(w, backendBase()+"/v1/browse/preview", body)
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

	proxyJSONPost(w, backendBase()+"/v1/browse/fetch", body)
}
