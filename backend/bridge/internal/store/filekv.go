package store

import (
	"bufio"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var ErrNotFound = errors.New("not found")

// FileKV is a Phase-1 placeholder persistence layer:
// - append-only JSONL log for records
// - atomic JSON index for lookups
//
// NOT a long-term design; replaceable later.
// No external dependencies.
type FileKV struct {
	mu        sync.Mutex
	dir       string
	logPath   string
	indexPath string
}

// Index maps internal keys to conversation IDs and offsets in the log.
// Fingerprints must never be logged.
type Index struct {
	FingerprintToID map[string]string `json:"fingerprint_to_id"`
	IDToOffset      map[string]int64  `json:"id_to_offset"`
}

func NewFileKV(dir string) (*FileKV, error) {
	if dir == "" {
		return nil, fmt.Errorf("dir required")
	}
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return nil, err
	}
	f := &FileKV{
		dir:       dir,
		logPath:   filepath.Join(dir, "conversations.jsonl"),
		indexPath: filepath.Join(dir, "conversations.index.json"),
	}
	// Ensure files exist
	if _, err := os.Stat(f.logPath); errors.Is(err, os.ErrNotExist) {
		if err := os.WriteFile(f.logPath, []byte{}, 0o640); err != nil {
			return nil, err
		}
	}
	if _, err := os.Stat(f.indexPath); errors.Is(err, os.ErrNotExist) {
		idx := &Index{
			FingerprintToID: map[string]string{},
			IDToOffset:      map[string]int64{},
		}
		if err := f.writeIndex(idx); err != nil {
			return nil, err
		}
	}
	return f, nil
}

func (f *FileKV) readIndex() (*Index, error) {
	b, err := os.ReadFile(f.indexPath)
	if err != nil {
		return nil, err
	}
	var idx Index
	if len(b) == 0 {
		idx.FingerprintToID = map[string]string{}
		idx.IDToOffset = map[string]int64{}
		return &idx, nil
	}
	if err := json.Unmarshal(b, &idx); err != nil {
		return nil, err
	}
	if idx.FingerprintToID == nil {
		idx.FingerprintToID = map[string]string{}
	}
	if idx.IDToOffset == nil {
		idx.IDToOffset = map[string]int64{}
	}
	return &idx, nil
}

func (f *FileKV) writeIndex(idx *Index) error {
	tmp := f.indexPath + ".tmp"
	b, err := json.Marshal(idx)
	if err != nil {
		return err
	}
	if err := os.WriteFile(tmp, b, 0o640); err != nil {
		return err
	}
	return os.Rename(tmp, f.indexPath)
}

// AppendRecord appends a JSON record to the log and returns its starting byte offset.
func (f *FileKV) AppendRecord(v any) (int64, error) {
	fh, err := os.OpenFile(f.logPath, os.O_WRONLY|os.O_APPEND, 0o640)
	if err != nil {
		return 0, err
	}
	defer fh.Close()

	off, err := fh.Seek(0, io.SeekEnd)
	if err != nil {
		return 0, err
	}

	w := bufio.NewWriter(fh)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		return 0, err
	}
	if err := w.Flush(); err != nil {
		return 0, err
	}
	return off, nil
}

// ReadRecordAt reads a JSON record from a byte offset (line-delimited JSON).
func (f *FileKV) ReadRecordAt(offset int64, dst any) error {
	fh, err := os.Open(f.logPath)
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

// ---- Conversation-specific helpers ----

// GetConversationIDByFingerprint returns conversation_id for fingerprint.
func (f *FileKV) GetConversationIDByFingerprint(fingerprint string) (string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	idx, err := f.readIndex()
	if err != nil {
		return "", err
	}
	id, ok := idx.FingerprintToID[fingerprint]
	if !ok || id == "" {
		return "", ErrNotFound
	}
	return id, nil
}

// PutFingerprintIndex stores fingerprint -> conversation_id.
func (f *FileKV) PutFingerprintIndex(fingerprint, conversationID string) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	idx, err := f.readIndex()
	if err != nil {
		return err
	}
	idx.FingerprintToID[fingerprint] = conversationID
	return f.writeIndex(idx)
}

// PutIDOffset stores conversation_id -> offset.
func (f *FileKV) PutIDOffset(conversationID string, offset int64) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	idx, err := f.readIndex()
	if err != nil {
		return err
	}
	idx.IDToOffset[conversationID] = offset
	return f.writeIndex(idx)
}

// GetOffsetByID returns offset for conversation_id.
func (f *FileKV) GetOffsetByID(conversationID string) (int64, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	idx, err := f.readIndex()
	if err != nil {
		return 0, err
	}
	off, ok := idx.IDToOffset[conversationID]
	if !ok {
		return 0, ErrNotFound
	}
	return off, nil
}

// NewOpaqueID generates an opaque, random identifier with a prefix.
func NewOpaqueID(prefix string) (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	// time component aids debugging without being meaningful to clients
	now := time.Now().UTC().UnixNano()
	return fmt.Sprintf("%s_%x_%d", prefix, b[:], now), nil
}
