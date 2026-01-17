package main

import (
	"flag"
	"log"
	"net/http"
	"time"

	"github.com/Bulldog-Master/privxx/backend/core/internal/httpapi"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8091", "listen address")
	ttl := flag.Duration("ttl", 15*time.Minute, "identity session TTL (stub)")
	flag.Parse()

	_ = ttl // kept for compatibility with earlier stub behavior

	s := httpapi.NewServer()
	log.Printf("[BACKEND] stub starting on %s (ttl=%s)", *addr, ttl.String())
	log.Fatal(http.ListenAndServe(*addr, s.Handler()))
}
