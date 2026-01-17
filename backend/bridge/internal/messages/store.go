package messages

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

var ErrNotFound = errors.New("not found")

// Item is the Phase-1 canonical stored message item (ciphertext only).
type Item struct {
	OwnerSubject         string `json:"owner_subject"`
	ConversationID       string `json:"conversation_id"`
	PayloadCiphertextB64 string `json:"payload_ciphertext_b64"`
	EnvelopeFingerprint  string `json:"envelope_fingerprint"`
	CreatedAtUnix        int64  `json:"created_at_unix"`
	ExpiresAtUnix        int64  `json:"expires_at_unix,omitempty"`
	State                string `json:"state"` // "available" | "consumed"
}

// Index keeps minimal metadata for fast fetch and state transitions.
// It is rebuildable from the log, but we keep it updated atomically for Phase-1.
type Index struct {
	OwnerConvOrder map[string]map[string][]string `json:"owner_conv_order"` // owner -> conv -> fingerprints (append order)
	Fingerprint    map[string]FPEntry             `json:"fingerprint"`      // fp -> latest
}

// FPEntry tracks the latest record offset + state for a fingerprint.
type FPEntry struct {
	OwnerSubject   string `json:"owner_subject"`
	ConversationID string `json:"conversation_id"`
	Offset         int64  `json:"offset"`
	CreatedAtUnix  int64  `json:"created_at_unix"`
	ExpiresAtUnix  int64  `json:"expires_at_unix,omitempty"`
	State          string `json:"state"`
}

type Store struct {
	mu        sync.Mutex
	dir       string
	logPath   string
	indexPath string
}

func NewStore(dir string) (*Store, error) {
	if dir == "" {
		return nil, fmt.Errorf("dir required")
	}
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return nil, err
	}
	s := &Store{
		dir:       dir,
		logPath:   filepath.Join(dir, "messages.jsonl"),
		indexPath: filepath.Join(dir, "messages.index.json"),
	}
	// Ensure log exists
	if _, err := os.Stat(s.logPath); errors.Is(err, os.ErrNotExist) {
		if err := os.WriteFile(s.logPath, []byte{}, 0o640); err != nil {
			return nil, err
		}
	}
	// Ensure index exists
	if _, err := os.Stat(s.indexPath); errors.Is(err, os.ErrNotExist) {
		idx := &Index{
			OwnerConvOrder: map[string]map[string][]string{},
			Fingerprint:    map[string]FPEntry{},
		}
		if err := s.writeIndex(idx); err != nil {
			return nil, err
		}
	}
	return s, nil
}

func (s *Store) readIndex() (*Index, error) {
	b, err := os.ReadFile(s.indexPath)
	if err != nil {
		return nil, err
	}
	var idx Index
	if len(b) == 0 {
		idx.OwnerConvOrder = map[string]map[string][]string{}
		idx.Fingerprint = map[string]FPEntry{}
		return &idx, nil
	}
	if err := json.Unmarshal(b, &idx); err != nil {
		return nil, err
	}
	if idx.OwnerConvOrder == nil {
		idx.OwnerConvOrder = map[string]map[string][]string{}
	}
	if idx.Fingerprint == nil {
		idx.Fingerprint = map[string]FPEntry{}
	}
	return &idx, nil
}

func (s *Store) writeIndex(idx *Index) error {
	tmp := s.indexPath + ".tmp"
	b, err := json.Marshal(idx)
	if err != nil {
		return err
	}
	if err := os.WriteFile(tmp, b, 0o640); err != nil {
		return err
	}
	return os.Rename(tmp, s.indexPath)
}

func (s *Store) appendRecord(it *Item) (int64, error) {
	fh, err := os.OpenFile(s.logPath, os.O_WRONLY|os.O_APPEND, 0o640)
	if err != nil {
		return 0, err
	}
	defer fh.Close()

	off, err := fh.Seek(0, io.SeekEnd)
	if err != nil {
		return 0, err
	}

	w := bufio.NewWriter(fh)
	if err := json.NewEncoder(w).Encode(it); err != nil {
		return 0, err
	}
	if err := w.Flush(); err != nil {
		return 0, err
	}
	return off, nil
}

func (s *Store) readRecordAt(offset int64, dst any) error {
	fh, err := os.Open(s.logPath)
	if err != nil {
		return err
	}
	defer fh.Close()

	if _, err := fh.Seek(offset, io.SeekStart); err != nil {
		return err
	}
	r := bufio.NewReader(fh)
	line, err := r.ReadBytes('\n')
	if err != nil {
		return err
	}
	return json.Unmarshal(line, dst)
}

// PutAvailable stores an "available" ciphertext payload for (owner, conversation).
// fp is required and should be the envelope fingerprint.
func (s *Store) PutAvailable(ownerSubject, conversationID, payloadCiphertextB64 string, fp *string) (string, error) {
	if ownerSubject == "" {
		return "", fmt.Errorf("ownerSubject required")
	}
	if conversationID == "" {
		return "", fmt.Errorf("conversationID required")
	}
	if payloadCiphertextB64 == "" {
		return "", fmt.Errorf("payloadCiphertextB64 required")
	}
	if fp == nil || *fp == "" {
		return "", fmt.Errorf("fingerprint required")
	}

	now := time.Now().UTC().Unix()
	it := &Item{
		OwnerSubject:         ownerSubject,
		ConversationID:       conversationID,
		PayloadCiphertextB64: payloadCiphertextB64,
		EnvelopeFingerprint:  *fp,
		CreatedAtUnix:        now,
		ExpiresAtUnix:        now + (60 * 60 * 24 * 30), // ~30 days Phase-1 placeholder
		State:                "available",
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	off, err := s.appendRecord(it)
	if err != nil {
		return "", err
	}

	idx, err := s.readIndex()
	if err != nil {
		return "", err
	}
	if idx.OwnerConvOrder[ownerSubject] == nil {
		idx.OwnerConvOrder[ownerSubject] = map[string][]string{}
	}
	idx.OwnerConvOrder[ownerSubject][conversationID] = append(idx.OwnerConvOrder[ownerSubject][conversationID], *fp)

	idx.Fingerprint[*fp] = FPEntry{
		OwnerSubject:   ownerSubject,
		ConversationID: conversationID,
		Offset:         off,
		CreatedAtUnix:  it.CreatedAtUnix,
		ExpiresAtUnix:  it.ExpiresAtUnix,
		State:          it.State,
	}
	if err := s.writeIndex(idx); err != nil {
		return "", err
	}
	return *fp, nil
}

// FetchInbox returns AVAILABLE items for the owner across all conversations (newest first).
func (s *Store) FetchInbox(ownerSubject string, limit int) ([]Item, error) {
	if ownerSubject == "" {
		return nil, fmt.Errorf("ownerSubject required")
	}
	if limit <= 0 {
		limit = 10
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	idx, err := s.readIndex()
	if err != nil {
		return nil, err
	}

	type row struct {
		fp   string
		when int64
		conv string
	}
	var rows []row

	for conv, fps := range idx.OwnerConvOrder[ownerSubject] {
		for _, fp := range fps {
			meta, ok := idx.Fingerprint[fp]
			if !ok {
				continue
			}
			if meta.State != "available" {
				continue
			}
			rows = append(rows, row{fp: fp, when: meta.CreatedAtUnix, conv: conv})
		}
	}

	sort.Slice(rows, func(i, j int) bool { return rows[i].when > rows[j].when })

	var out []Item
	for _, r := range rows {
		if len(out) >= limit {
			break
		}
		meta := idx.Fingerprint[r.fp]
		var it Item
		if err := s.readRecordAt(meta.Offset, &it); err != nil {
			continue
		}
		// Ensure we return consistent view: latest state must still be available
		if meta.State != "available" {
			continue
		}
		out = append(out, it)
	}

	return out, nil
}

// FetchThread returns items for the owner in a conversation (newest first).
// includeConsumed=true returns both available + consumed (history view).
// includeConsumed=false returns only available (queue-like view).
func (s *Store) FetchThread(ownerSubject, conversationID string, limit int, includeConsumed bool) ([]Item, error) {
	if ownerSubject == "" {
		return nil, fmt.Errorf("ownerSubject required")
	}
	if conversationID == "" {
		return nil, fmt.Errorf("conversationID required")
	}
	if limit <= 0 {
		limit = 10
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	idx, err := s.readIndex()
	if err != nil {
		return nil, err
	}

	fps := idx.OwnerConvOrder[ownerSubject][conversationID]

	// Walk backwards (append order -> newest last)
	var out []Item
	for i := len(fps) - 1; i >= 0 && len(out) < limit; i-- {
		fp := fps[i]
		meta, ok := idx.Fingerprint[fp]
		if !ok {
			continue
		}
		// Owner/conversation safety (defensive)
		if meta.OwnerSubject != ownerSubject || meta.ConversationID != conversationID {
			continue
		}

		if includeConsumed {
			if meta.State != "available" && meta.State != "consumed" {
				continue
			}
		} else {
			if meta.State != "available" {
				continue
			}
		}

		var it Item
		if err := s.readRecordAt(meta.Offset, &it); err != nil {
			continue
		}
		out = append(out, it)
	}
	return out, nil
}

// AckAvailable marks one or more fingerprints as CONSUMED for the owner.
// If conversationID == "" it will ack across any conversation owned by ownerSubject (still validated by fingerprint meta).
func (s *Store) AckAvailable(ownerSubject, conversationID string, fps []string) (int, error) {
	if ownerSubject == "" {
		return 0, fmt.Errorf("ownerSubject required")
	}
	if len(fps) == 0 {
		return 0, fmt.Errorf("envelopeFingerprints required")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	idx, err := s.readIndex()
	if err != nil {
		return 0, err
	}

	acked := 0

	for _, fp := range fps {
		fp = stringsTrim(fp)
		if fp == "" {
			continue
		}
		meta, ok := idx.Fingerprint[fp]
		if !ok {
			continue
		}
		if meta.OwnerSubject != ownerSubject {
			continue
		}
		if conversationID != "" && meta.ConversationID != conversationID {
			continue
		}
		if meta.State != "available" {
			continue
		}

		// Read existing record to preserve payload
		var prev Item
		if err := s.readRecordAt(meta.Offset, &prev); err != nil {
			continue
		}

		// Append consumed record (latest-wins)
		now := time.Now().UTC().Unix()
		consumed := &Item{
			OwnerSubject:         prev.OwnerSubject,
			ConversationID:       prev.ConversationID,
			PayloadCiphertextB64: prev.PayloadCiphertextB64,
			EnvelopeFingerprint:  prev.EnvelopeFingerprint,
			CreatedAtUnix:        prev.CreatedAtUnix,
			ExpiresAtUnix:        prev.ExpiresAtUnix,
			State:                "consumed",
		}
		off, err := s.appendRecord(consumed)
		if err != nil {
			return acked, err
		}

		meta.Offset = off
		meta.State = "consumed"
		meta.CreatedAtUnix = now // not used for ordering; safe
		idx.Fingerprint[fp] = meta
		acked++
	}

	if acked > 0 {
		if err := s.writeIndex(idx); err != nil {
			return acked, err
		}
	}

	return acked, nil
}

// stringsTrim avoids importing strings everywhere in this file.
func stringsTrim(s string) string {
	// minimal trim for Phase-1
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\n' || s[0] == '\r' || s[0] == '\t') {
		s = s[1:]
	}
	for len(s) > 0 {
		c := s[len(s)-1]
		if c == ' ' || c == '\n' || c == '\r' || c == '\t' {
			s = s[:len(s)-1]
			continue
		}
		break
	}
	return s
}
