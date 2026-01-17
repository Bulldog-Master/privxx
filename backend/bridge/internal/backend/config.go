package backend

import (
	"errors"
	"os"
	"time"
)

// Config represents backend connection configuration.
// NOTE: Code-only. Not wired. Not used.
type Config struct {
	Addr    string
	Timeout time.Duration
}

// LoadConfig loads backend config from environment variables.
// Required:
//
//	BACKEND_ADDR
//
// Optional:
//
//	BACKEND_TIMEOUT (default: 5s)
func LoadConfig() (*Config, error) {
	addr := os.Getenv("BACKEND_ADDR")
	if addr == "" {
		return nil, errors.New("BACKEND_ADDR not set")
	}

	timeoutStr := os.Getenv("BACKEND_TIMEOUT")
	if timeoutStr == "" {
		timeoutStr = "5s"
	}

	timeout, err := time.ParseDuration(timeoutStr)
	if err != nil {
		return nil, err
	}

	return &Config{
		Addr:    addr,
		Timeout: timeout,
	}, nil
}
