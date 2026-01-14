# PHASE2_CONTRACT.md — Phase-2 Optional Plaintext Rendering

**Status:** Draft (Design-Approved, Not Implemented)  
**Compatibility:** Backwards-compatible with Phase-1 (Phase-1 clients unchanged)

---

## 1) Goals

- Zero private keys in browser
- No cryptographic operations in browser
- No new endpoints (only backwards-compatible request/response extensions)
- Explicit, session-scoped capability gating for plaintext
- Preserve all Phase-1 guarantees (no read receipts, no presence, best-effort ordering)

---

## 2) High-Level Model (Canonical)

**Backend Core (private engine) performs decryption, not the Bridge.**

- Messages remain ciphertext at rest.
- Decryption occurs only inside Backend Core (private).
- Bridge remains thin: JWT auth, session issuance passthrough, rate limiting, headers.
- Browser receives plaintext only when explicitly authorized by a capability-scoped session.

```
┌─────────────────┐
│    Browser      │  ← Never holds keys, never decrypts
└────────┬────────┘
         │ HTTPS + JWT + apikey
         ▼
┌─────────────────┐
│     Bridge      │  ← Thin control plane: auth, session, rate limit
│  (public-facing)│     Does NOT decrypt or parse message content
└────────┬────────┘
         │ Private/localhost
         ▼
┌─────────────────┐
│  Backend Core   │  ← Holds keys, performs decryption
│    (private)    │     Returns plaintextB64 when authorized
└─────────────────┘
```

---

## 3) Backwards-compatible Message Item Shape

Phase-1 fields unchanged; Phase-2 adds optional plaintext:

```typescript
type MessageItem = {
  conversationId: string;
  envelopeFingerprint: string;
  payloadCiphertextB64: string;
  plaintextB64?: string;     // optional enhancement, may be omitted entirely
  createdAtUnix: number;
  expiresAtUnix: number;
  state: "available" | "consumed";
};
```

**Rules:**

- `plaintextB64` is present only when a receive session includes `decrypt` capability.
- If not authorized, omit `plaintextB64` (do not send `null`).
- Frontend must treat plaintext as optional.

---

## 4) Session issuance (extended, backwards-compatible)

`POST /session/issue` accepts an optional `capabilities` list:

```json
{
  "purpose": "message_receive",
  "conversationId": "conv_...",
  "capabilities": ["decrypt"]
}
```

**Capability rules:**

- No capabilities → Phase-1 behavior (ciphertext only)
- `decrypt` → Backend Core may include `plaintextB64` in `/message/thread` responses
- Capabilities are session-scoped (not global)
- Backend may deny `decrypt` even if unlocked (policy hook)

---

## 5) Endpoint behavior (no new endpoints)

| Endpoint | Phase-2 Behavior |
|----------|------------------|
| `/message/inbox` | Remains ciphertext-only (discovery/queue) |
| `/message/thread` | May include `plaintextB64` when `decrypt` capability granted |
| `/message/send` | Unchanged |
| `/message/ack` | Unchanged (delivery bookkeeping only; consumed ≠ read) |

**Required headers (unchanged):**
- `Authorization: Bearer <Supabase JWT>`
- `apikey: <Supabase Anon Key>`

---

## 6) Security + operational requirements (unchanged from Phase-1)

- All messaging endpoints MUST return `Cache-Control: no-store`
- No plaintext logging (Bridge or Backend)
- Frontend must not store plaintext in persistent storage
- UI labels remain: `available` = "New"/"Undelivered", `consumed` = "Delivered" (never "Read")

---

## 7) Frontend rendering

```typescript
if (item.plaintextB64) {
  render(decodeBase64(item.plaintextB64));
} else {
  render("Encrypted message (Phase-1)");
}
```

---

## 8) Frontend enhancement (safe now): IntersectionObserver

- Load thread only when visible
- Pause polling when backgrounded
- Prevents unnecessary decrypt sessions later

(Use existing React hook patterns; no protocol changes required.)

---

## 9) Migration Safety

- Phase-1 UI: unchanged
- Phase-2 UI: progressively enhanced
- No breaking schema changes
- No client-side crypto mistakes
- Backend Core upgrade path independent of Bridge

---

## Key Architectural Principle

> **Bridge is control plane, not data plane.**
> 
> Bridge never handles message content (plaintext). Decryption occurs exclusively
> in Backend Core. This preserves attack surface minimization and aligns with
> the founding "Browser as Author, Bridge as Executor" model.
