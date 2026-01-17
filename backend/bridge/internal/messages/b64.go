package messages

import "encoding/base64"

func DecodeB64(s string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(s)
}
