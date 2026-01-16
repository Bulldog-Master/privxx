package api

// VERSIONING
const APIVersion = 1

// ---------- COMMON ----------

type BaseReq struct {
	V     int    `json:"v"`
	ReqID string `json:"reqId"`
}

type BaseResp struct {
	V     int     `json:"v"`
	ReqID string  `json:"reqId"`
	Ok    bool    `json:"ok"`
	Error *APIError `json:"error,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ---------- HEALTH ----------

type HealthResp struct {
	Status string `json:"status"`
	Stub   bool   `json:"stub"`
}

// ---------- CONNECT ----------

type ConnectReq struct {
	BaseReq
	UserID string `json:"userId"`
}

type ConnectResp struct {
	BaseResp
	SessionID string `json:"sessionId,omitempty"`
}

// ---------- STATUS ----------

type StatusReq struct {
	BaseReq
	SessionID string `json:"sessionId"`
}

type StatusResp struct {
	BaseResp
	State string `json:"state"`
}

// ---------- DISCONNECT ----------

type DisconnectReq struct {
	BaseReq
	SessionID string `json:"sessionId"`
}

type DisconnectResp struct {
	BaseResp
}
