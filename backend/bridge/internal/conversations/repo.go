package conversations

import (
	"fmt"
	"time"

	"github.com/Bulldog-Master/privxx/backend/bridge/internal/store"
)

// Repo persists and retrieves conversations.
// Fingerprints are internal-only and must never be logged.
type Repo struct {
	kv *store.FileKV
}

func NewRepo(kv *store.FileKV) *Repo {
	return &Repo{kv: kv}
}

// CreateOrGetConversation is idempotent by peerFingerprint.
// peerRefEncrypted is stored opaque and never used for lookup.
func (r *Repo) CreateOrGetConversation(ownerSubject string, peerFingerprint string, peerRefEncrypted []byte) (*Conversation, error) {
	if ownerSubject == "" {
		return nil, fmt.Errorf("ownerSubject required")
	}
	if peerFingerprint == "" {
		return nil, fmt.Errorf("peerFingerprint required")
	}
	// 1) Lookup by fingerprint
	if existingID, err := r.kv.GetConversationIDByFingerprint(peerFingerprint); err == nil {
		return r.GetConversation(existingID)
	} else if err != store.ErrNotFound {
		return nil, err
	}

	// 2) Create new conversation
	convID, err := store.NewOpaqueID("conv")
	if err != nil {
		return nil, err
	}

	conv := &Conversation{
		OwnerSubject:    ownerSubject,
		ConversationID:   convID,
		PeerFingerprint:  peerFingerprint,
		PeerRefEncrypted: append([]byte(nil), peerRefEncrypted...),
		CreatedAtUnix:    time.Now().UTC().Unix(),
		State:            "active",
	}

	// 3) Append record + index (write record first, then index)
	off, err := r.kv.AppendRecord(conv)
	if err != nil {
		return nil, err
	}
	if err := r.kv.PutIDOffset(convID, off); err != nil {
		return nil, err
	}
	if err := r.kv.PutFingerprintIndex(peerFingerprint, convID); err != nil {
		return nil, err
	}

	return conv, nil
}

func (r *Repo) GetConversation(conversationID string) (*Conversation, error) {
	if conversationID == "" {
		return nil, fmt.Errorf("conversationID required")
	}
	off, err := r.kv.GetOffsetByID(conversationID)
	if err != nil {
		return nil, err
	}
	var conv Conversation
	if err := r.kv.ReadRecordAt(off, &conv); err != nil {
		return nil, err
	}
	// Minimal validation
	if conv.ConversationID != conversationID {
		return nil, fmt.Errorf("conversation record mismatch")
	}
	return &conv, nil
}
