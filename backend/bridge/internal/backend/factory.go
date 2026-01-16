package backend

// NewFromConfig constructs a backend Client from Config.
// NOTE:
// - Code-only
// - NOT wired
// - NOT used anywhere yet
func NewFromConfig(cfg *Config) *Client {
	return New(cfg.Addr, cfg.Timeout)
}
