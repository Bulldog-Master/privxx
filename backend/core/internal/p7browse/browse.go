package p7browse

import (
	"bytes"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var errForbiddenTarget = &TargetError{Code: "forbidden_target", Message: "forbidden target"}

type TargetError struct {
	Code    string
	Message string
}

func (e *TargetError) Error() string { return e.Message }

// isPrivateIP blocks RFC1918, loopback, link-local, multicast, etc.
func isPrivateIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	ip = ip.To16()
	if ip == nil {
		return true
	}

	// loopback
	if ip.IsLoopback() {
		return true
	}
	// link-local
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return true
	}
	// multicast
	if ip.IsMulticast() {
		return true
	}
	// unspecified
	if ip.IsUnspecified() {
		return true
	}

	// RFC1918 (IPv4)
	if v4 := ip.To4(); v4 != nil {
		if v4[0] == 10 {
			return true
		}
		if v4[0] == 172 && v4[1]&0xf0 == 16 {
			return true
		}
		if v4[0] == 192 && v4[1] == 168 {
			return true
		}
		// CGNAT 100.64.0.0/10
		if v4[0] == 100 && v4[1]&0xc0 == 64 {
			return true
		}
		// metadata / link-local 169.254.0.0/16
		if v4[0] == 169 && v4[1] == 254 {
			return true
		}
		return false
	}

	// ULA fc00::/7
	if ip[0]&0xfe == 0xfc {
		return true
	}
	return false
}

func denyPrivateTargets(host string) error {
	host = strings.TrimSpace(strings.ToLower(host))
	if host == "" {
		return errForbiddenTarget
	}
	if host == "localhost" || host == "localhost.localdomain" {
		return errForbiddenTarget
	}

	ips, err := net.LookupIP(host)
	if err != nil {
		// if we can't resolve, deny (safe default)
		return errForbiddenTarget
	}
	for _, ip := range ips {
		if isPrivateIP(ip) {
			return errForbiddenTarget
		}
	}
	return nil
}

// ValidateURL enforces http(s) and blocks private targets.
func ValidateURL(raw string) (*url.URL, error) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || u == nil {
		return nil, &TargetError{Code: "bad_request", Message: "invalid url"}
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, &TargetError{Code: "bad_request", Message: "invalid url"}
	}
	host := u.Hostname()
	if host == "" {
		return nil, &TargetError{Code: "bad_request", Message: "invalid host"}
	}

	// block direct IPs too
	if ip := net.ParseIP(host); ip != nil && isPrivateIP(ip) {
		return nil, errForbiddenTarget
	}
	if err := denyPrivateTargets(host); err != nil {
		return nil, errForbiddenTarget
	}
	return u, nil
}

type Preview struct {
	FinalURL    string
	Status      int
	ContentType string
	Title       string
}

type Fetch struct {
	FinalURL    string
	Status      int
	ContentType string
	Title       string
	Text        string
}

func httpClient() *http.Client {
	return &http.Client{
		Timeout: 12 * time.Second,
		CheckRedirect: func(r *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return http.ErrUseLastResponse
			}
			h := r.URL.Hostname()
			if h == "" {
				return http.ErrUseLastResponse
			}
			if h == "localhost" || h == "localhost.localdomain" {
				return http.ErrUseLastResponse
			}
			if ip := net.ParseIP(h); ip != nil && isPrivateIP(ip) {
				return http.ErrUseLastResponse
			}
			if err := denyPrivateTargets(h); err != nil {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}
}

func extractTitle(b []byte) string {
	// tiny, safe title extraction
	lower := bytes.ToLower(b)
	i := bytes.Index(lower, []byte("<title"))
	if i < 0 {
		return ""
	}
	gt := bytes.IndexByte(lower[i:], '>')
	if gt < 0 {
		return ""
	}
	start := i + gt + 1
	j := bytes.Index(lower[start:], []byte("</title>"))
	if j < 0 {
		return ""
	}
	title := string(bytes.TrimSpace(b[start : start+j]))
	// hard cap
	if len(title) > 256 {
		title = title[:256]
	}
	return title
}

func stripScriptStyleNoscript(b []byte) []byte {
	out := b
	out = stripBlock(out, []byte("<script"), []byte("</script>"))
	out = stripBlock(out, []byte("<style"), []byte("</style>"))
	out = stripBlock(out, []byte("<noscript"), []byte("</noscript>"))
	return out
}

func stripBlock(b []byte, openPrefix, closeTag []byte) []byte {
	lower := bytes.ToLower(b)
	var out bytes.Buffer

	i := 0
	for {
		oi := bytes.Index(lower[i:], openPrefix)
		if oi < 0 {
			out.Write(b[i:])
			break
		}
		oi += i
		out.Write(b[i:oi])

		gt := bytes.IndexByte(lower[oi:], '>')
		if gt < 0 {
			break
		}
		gt = oi + gt + 1

		ci := bytes.Index(lower[gt:], closeTag)
		if ci < 0 {
			break
		}
		ci = gt + ci + len(closeTag)

		i = ci
	}
	return out.Bytes()
}

func stripTags(b []byte) []byte {
	var out bytes.Buffer
	inTag := false
	for _, c := range b {
		switch c {
		case '<':
			inTag = true
		case '>':
			inTag = false
		default:
			if !inTag {
				out.WriteByte(c)
			}
		}
	}
	// whitespace normalize (simple)
	s := strings.Join(strings.Fields(out.String()), " ")
	return []byte(s)
}

func PreviewURL(raw string) (*Preview, error) {
	u, err := ValidateURL(raw)
	if err != nil {
		return nil, err
	}

	req, _ := http.NewRequest(http.MethodGet, u.String(), nil)
	req.Header.Set("User-Agent", "Privxx/0.4.0 (+https://privxx.app)")

	resp, err := httpClient().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	const maxBytes = 64 * 1024
	b, _ := io.ReadAll(io.LimitReader(resp.Body, maxBytes))

	return &Preview{
		FinalURL:    resp.Request.URL.String(),
		Status:      resp.StatusCode,
		ContentType: resp.Header.Get("Content-Type"),
		Title:       extractTitle(b),
	}, nil
}

func FetchURL(raw string) (*Fetch, error) {
	u, err := ValidateURL(raw)
	if err != nil {
		return nil, err
	}

	req, _ := http.NewRequest(http.MethodGet, u.String(), nil)
	req.Header.Set("User-Agent", "Privxx/0.4.0 (+https://privxx.app)")

	resp, err := httpClient().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	const maxBytes = 256 * 1024
	b, _ := io.ReadAll(io.LimitReader(resp.Body, maxBytes))

	title := extractTitle(b)
	b = stripScriptStyleNoscript(b)
	plain := stripTags(b)

	// hard cap text length
	txt := string(plain)
	if len(txt) > 50_000 {
		txt = txt[:50_000]
	}

	return &Fetch{
		FinalURL:    resp.Request.URL.String(),
		Status:      resp.StatusCode,
		ContentType: resp.Header.Get("Content-Type"),
		Title:       title,
		Text:        txt,
	}, nil
}
