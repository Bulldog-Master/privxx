package backend

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

type Client struct {
	addr    string
	timeout time.Duration
	http    *http.Client
}

func New(addr string, timeout time.Duration) *Client {
	return &Client{
		addr:    addr,
		timeout: timeout,
		http: &http.Client{
			Timeout: timeout,
		},
	}
}

type HealthResponse struct {
	Status string `json:"status"`
	Stub   bool   `json:"stub,omitempty"`
}

func (c *Client) Health(ctx context.Context) (*HealthResponse, error) {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		c.addr+"/health",
		nil,
	)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("backend health returned non-200")
	}

	var out HealthResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}

	return &out, nil
}
