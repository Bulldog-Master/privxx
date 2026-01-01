# Phase D Go Bridge Changes Required

## Overview

This document specifies the changes needed in `backend/bridge/main.go` to support real cMixx integration. The frontend is now ready with event-driven connection handling.

---

## New Endpoint Required

### POST /connect

Accepts a `connect_intent` message and returns a `connect_ack`.

#### Request

```json
{
  "v": 1,
  "type": "connect_intent",
  "requestId": "req_abc123",
  "sessionId": "sess_001",
  "targetUrl": "https://example.com",
  "clientTime": "2025-12-14T12:00:00Z"
}
```

#### Response (Success)

```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "req_abc123",
  "sessionId": "sess_001",
  "ack": true,
  "status": "connected",
  "serverTime": "2025-12-14T12:00:02Z"
}
```

#### Response (Error)

```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "req_abc123",
  "sessionId": "sess_001",
  "ack": false,
  "status": "error",
  "errorCode": "INVALID_URL"
}
```

---

## Implementation Steps

### 1. Add Message Types

```go
type ConnectIntent struct {
    V          int    `json:"v"`
    Type       string `json:"type"`
    RequestID  string `json:"requestId"`
    SessionID  string `json:"sessionId"`
    TargetURL  string `json:"targetUrl"`
    ClientTime string `json:"clientTime"`
}

type ConnectAck struct {
    V          int    `json:"v"`
    Type       string `json:"type"`
    RequestID  string `json:"requestId"`
    SessionID  string `json:"sessionId"`
    Ack        bool   `json:"ack"`
    Status     string `json:"status"`
    ServerTime string `json:"serverTime,omitempty"`
    ErrorCode  string `json:"errorCode,omitempty"`
}
```

### 2. Add /connect Handler

```go
func (s *Server) handleConnect(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var intent ConnectIntent
    if err := json.NewDecoder(r.Body).Decode(&intent); err != nil {
        writeConnectError(w, intent, "INVALID_MESSAGE")
        return
    }

    // Validate intent
    if intent.Type != "connect_intent" || intent.TargetURL == "" {
        writeConnectError(w, intent, "INVALID_URL")
        return
    }

    // TODO: Send via cMixx and wait for response
    // For now, simulate the round-trip
    startTime := time.Now()
    
    // When xxDK is ready, replace this with:
    // ack, err := s.sendViaCmixx(intent)
    time.Sleep(time.Duration(500+rand.Intn(2000)) * time.Millisecond)
    
    latency := time.Since(startTime)

    ack := ConnectAck{
        V:          1,
        Type:       "connect_ack",
        RequestID:  intent.RequestID,
        SessionID:  intent.SessionID,
        Ack:        true,
        Status:     "connected",
        ServerTime: time.Now().UTC().Format(time.RFC3339),
    }

    log.Printf("[Connect] Success in %v: %s -> %s", 
        latency, intent.RequestID, intent.TargetURL)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(ack)
}

func writeConnectError(w http.ResponseWriter, intent ConnectIntent, errorCode string) {
    ack := ConnectAck{
        V:         1,
        Type:      "connect_ack",
        RequestID: intent.RequestID,
        SessionID: intent.SessionID,
        Ack:       false,
        Status:    "error",
        ErrorCode: errorCode,
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK) // ACK is always 200, error is in payload
    json.NewEncoder(w).Encode(ack)
}
```

### 3. Register Route

```go
mux.HandleFunc("/connect", s.handleConnect)
```

---

## CORS Configuration

Ensure the `/connect` endpoint allows CORS from the frontend origin:

```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")
        if isAllowedOrigin(origin) {
            w.Header().Set("Access-Control-Allow-Origin", origin)
            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
            w.Header().Set("Access-Control-Allow-Credentials", "true")
        }
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

---

## Testing

### Manual Test

```bash
curl -X POST http://66.94.109.237:8090/connect \
  -H "Content-Type: application/json" \
  -d '{
    "v": 1,
    "type": "connect_intent",
    "requestId": "req_test123",
    "sessionId": "sess_test001",
    "targetUrl": "https://example.com",
    "clientTime": "2025-12-14T12:00:00Z"
  }'
```

### Expected Response

```json
{
  "v": 1,
  "type": "connect_ack",
  "requestId": "req_test123",
  "sessionId": "sess_test001",
  "ack": true,
  "status": "connected",
  "serverTime": "2025-12-14T12:00:02Z"
}
```

---

## Phase D Completion Criteria

- [ ] `/connect` endpoint returns valid `connect_ack`
- [ ] Frontend transitions to "Secure" on successful ACK
- [ ] Latency reflects real round-trip time
- [ ] Logs show `connect_intent` received and `connect_ack` sent
- [ ] UI visuals unchanged (locked)

---

## Next: Real cMixx Integration

Once the simulated `/connect` works end-to-end:

1. Replace `time.Sleep()` with actual xxDK send/receive
2. Use `client.SendE2E()` to send intent via cMixx
3. Use `client.RegisterListener()` to receive ack via cMixx
4. Map cMixx message IDs to request/session IDs
5. Handle cMixx-specific errors gracefully

---

*Frontend is ready. Backend changes are the critical path.*
