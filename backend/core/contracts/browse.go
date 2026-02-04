package contracts

// BrowsePreviewIntent requests safe metadata-only preview of a URL.
type BrowsePreviewIntent struct {
	V          int    `json:"v"`
	UserID     string `json:"userId"`
	URL        string `json:"url"`
	ClientTime string `json:"clientTime"`
}

type BrowsePreviewResult struct {
	Ok          bool    `json:"ok"`
	URL         string  `json:"url"`
	FinalURL    string  `json:"finalUrl,omitempty"`
	FetchedAt   string  `json:"fetchedAt,omitempty"`
	Status      int     `json:"status,omitempty"`
	ContentType string  `json:"contentType,omitempty"`
	Title       string  `json:"title,omitempty"`
	Error       *string `json:"error,omitempty"`
	Code        *string `json:"code,omitempty"`
	Message     *string `json:"message,omitempty"`
}

// BrowseFetchIntent requests safe plaintext extraction from a URL.
type BrowseFetchIntent struct {
	V          int    `json:"v"`
	UserID     string `json:"userId"`
	URL        string `json:"url"`
	ClientTime string `json:"clientTime"`
}

type BrowseFetchResult struct {
	Ok          bool    `json:"ok"`
	URL         string  `json:"url"`
	FinalURL    string  `json:"finalUrl,omitempty"`
	FetchedAt   string  `json:"fetchedAt,omitempty"`
	Status      int     `json:"status,omitempty"`
	ContentType string  `json:"contentType,omitempty"`
	Title       string  `json:"title,omitempty"`
	Text        string  `json:"text,omitempty"`
	Error       *string `json:"error,omitempty"`
	Code        *string `json:"code,omitempty"`
	Message     *string `json:"message,omitempty"`
}
