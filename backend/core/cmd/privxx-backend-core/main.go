package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/Bulldog-Master/privxx/backend/core/internal/httpapi"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8091", "listen address")
	
	s := httpapi.NewServer()
	log.Printf("[BACKEND] backend core starting on %s", *addr)
	log.Fatal(http.ListenAndServe(*addr, s.Handler()))
}
