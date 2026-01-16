package messages

import (
	"crypto/rand"
	"errors"

	"golang.org/x/crypto/chacha20poly1305"
)

// encryptBuild encrypts plaintext using a process-local key (build-only).
// Returns ciphertext = nonce || aead(ciphertext).
// IMPORTANT: caller must keep plaintext lifetime minimal.
func encryptBuild(key *[32]byte, plaintext []byte) ([]byte, error) {
	if key == nil {
		return nil, errors.New("nil key")
	}
	aead, err := chacha20poly1305.NewX(key[:])
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, chacha20poly1305.NonceSizeX)
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	ct := aead.Seal(nil, nonce, plaintext, nil)
	out := make([]byte, 0, len(nonce)+len(ct))
	out = append(out, nonce...)
	out = append(out, ct...)
	return out, nil
}

// decryptBuild decrypts ciphertext produced by encryptBuild.
// IMPORTANT: plaintext must remain transient and never persisted.
func decryptBuild(key *[32]byte, ciphertext []byte) ([]byte, error) {
	if key == nil {
		return nil, errors.New("nil key")
	}
	if len(ciphertext) < chacha20poly1305.NonceSizeX {
		return nil, errors.New("ciphertext too short")
	}
	aead, err := chacha20poly1305.NewX(key[:])
	if err != nil {
		return nil, err
	}
	nonce := ciphertext[:chacha20poly1305.NonceSizeX]
	ct := ciphertext[chacha20poly1305.NonceSizeX:]
	pt, err := aead.Open(nil, nonce, ct, nil)
	if err != nil {
		return nil, err
	}
	return pt, nil
}
