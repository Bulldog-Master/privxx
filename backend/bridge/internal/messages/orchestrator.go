package messages

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"time"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/conversations"
	"github.com/Bulldog-Master/privxx/backend/bridge/internal/transport"
)

var (
	ErrUnknownConversation = errors.New("unknown conversation")
)

// Orchestrator coordinates Phase-1 message send/receive.
// IMPORTANT: plaintext must never be persisted; only transient in function scope.
type Orchestrator struct {
	convRepo *conversations.Repo
	store    *Store
	tx       transport.Adapter

	// Phase-1: symmetric key placeholder for build-only encryption.
	// In real use this will be derived from conversation/identity keys.
	// NOTE: This must not be logged.
	key [32]byte

	maxEnvelopeBytes int
}

func NewOrchestrator(convRepo *conversations.Repo, store *Store, tx transport.Adapter, maxEnvelopeBytes int) (*Orchestrator, error) {
	if convRepo == nil || store == nil || tx == nil {
		return nil, errors.New("convRepo, store, tx required")
	}
	if maxEnvelopeBytes <= 0 {
		maxEnvelopeBytes = 4096
	}
	o := &Orchestrator{
		convRepo:         convRepo,
		store:            store,
		tx:               tx,
		maxEnvelopeBytes: maxEnvelopeBytes,
	}
	// Build-only key (random per process). Do not persist.
	_, _ = rand.Read(o.key[:])
	return o, nil
}

// SendText stores ciphertext and attempts transport inject.
// Returns user-facing state: "Sent" on success path (even if delivery is delayed by mixnet).
func (o *Orchestrator) SendText(ctx context.Context, ownerSubject string, conversationID string, plaintext []byte) (string, error) {
	if ownerSubject == "" {
		return "", errors.New("ownerSubject required")
	}
	if conversationID == "" {
		return "", errors.New("conversationID required")
	}
	if len(plaintext) == 0 {
		return "", errors.New("empty message")
	}

	// 1) Load conversation (NO auto-create)
	conv, err := o.convRepo.GetConversation(conversationID)
	if err != nil {
		return "", ErrUnknownConversation
	}
	if conv.OwnerSubject != ownerSubject {
		return "", ErrUnknownConversation
	}

	// 2) Encrypt plaintext (transient only)
	ciphertext, err := encryptBuild(&o.key, plaintext)
	if err != nil {
		return "", err
	}

	// 3) Build envelope (ciphertext only)
	env := &EnvelopeV1{
		V:              1,
		ConversationID: conversationID,
		Ciphertext:     ciphertext,
		CreatedAtUnix:  nowUnix(),
	}

	// 4) Encode envelope + enforce max size
	encoded, err := EncodeEnvelope(env)
	if err != nil {
		return "", err
	}
	if len(encoded) > o.maxEnvelopeBytes {
		return "", transport.ErrEnvelopeTooLarge
	}

	// 5) Persist ciphertext only (as base64 string)
	b64 := base64.StdEncoding.EncodeToString(encoded)
	fp := hashEnvelope(encoded)
	_, err = o.store.PutAvailable(ownerSubject, conversationID, b64, &fp)
	if err != nil {
		return "", err
	}

	// 6) Transport inject
	if err := o.tx.Send(ctx, encoded); err != nil {
		return "", err
	}

	return "Sent", nil
}

// OnReceiveEnvelope handles a received envelope (ciphertext bytes).
// It may decrypt transiently ONLY to route; it MUST persist ciphertext only.
func (o *Orchestrator) OnReceiveEnvelope(ctx context.Context, envelopeCiphertext []byte) error {
	_ = ctx
	if len(envelopeCiphertext) == 0 {
		return errors.New("empty envelope")
	}

	// 1) Decode + validate envelope
	env, err := DecodeEnvelope(envelopeCiphertext)
	if err != nil {
		return err
	}

	// 2) Load conversation (must exist)
	conv, err := o.convRepo.GetConversation(env.ConversationID)
	if err != nil {
		return ErrUnknownConversation
	}
	if conv.OwnerSubject == "" {
		return errors.New("conversation missing owner")
	}

	// 3) Persist ciphertext-only (base64 of encoded envelope)
	b64 := base64.StdEncoding.EncodeToString(envelopeCiphertext)
	fp := hashEnvelope(envelopeCiphertext)
	_, err = o.store.PutAvailable(conv.OwnerSubject, env.ConversationID, b64, &fp)
	if err != nil {
		return err
	}

	return nil
}

// hashEnvelope is optional internal fingerprinting for future dedupe.
func hashEnvelope(b []byte) string {
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

func nowUnix() int64 { return time.Now().UTC().Unix() }
