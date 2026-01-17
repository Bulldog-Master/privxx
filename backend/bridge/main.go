package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/conversations"
	"github.com/Bulldog-Master/privxx/backend/bridge/internal/messages"
	"github.com/Bulldog-Master/privxx/backend/bridge/internal/store"
)

// NOTE:
// Phase 3.3.6 SECURITY HARDENING
// --------------------------------------------------
// ALL admin HTTP routes have been REMOVED at code level.
// - No /admin/* handlers exist
// - No rate-limit reset endpoint
// - Operational control must be done via restart only
//
// This is intentional and permanent for Phase-1/Phase-2.
// --------------------------------------------------

var (
	fileKV           *store.FileKV
	conversationRepo *conversations.Repo
	messageStore     *messages.Store
)

func main() {
	var err error

	fileKV, err = store.NewFileKV("./data")
	if err != nil {
		log.Fatalf("[FATAL] failed to init local store: %v", err)
	}

	conversationRepo = conversations.NewRepo(fileKV)

	messageStore, err = messages.NewStore("./data")
	if err != nil {
		log.Fatalf("[FATAL] failed to init message store: %v", err)
	}

	mux := http.NewServeMux()

	// Core operational endpoints ONLY
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/unlock", handleUnlock)
	mux.HandleFunc("/unlock/status", handleUnlockStatus)
	mux.HandleFunc("/lock", handleLock)
	mux.HandleFunc("/connect", handleConnect)
	mux.HandleFunc("/status", handleStatus)
	mux.HandleFunc("/disconnect", handleDisconnect)

	srv := &http.Server{
		Addr:         ":8090",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Endpoints: /health, /unlock, /unlock/status, /lock, /connect, /status, /disconnect")
	log.Printf("Privxx Bridge starting on %s", srv.Addr)

	log.Fatal(srv.ListenAndServe())
}
