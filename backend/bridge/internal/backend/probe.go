package backend

import (
	"context"
	"log"
)

// ProbeHealth performs a one-shot backend health check.
// NOTE:
// - Code-only
// - NOT wired to handlers
// - NOT called from main
func ProbeHealth(c *Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), c.timeout)
	defer cancel()

	resp, err := c.Health(ctx)
	if err != nil {
		return err
	}

	log.Printf("[BACKEND] health ok (stub=%v)", resp.Stub)
	return nil
}
