# Privxx — Connection State Machine

**Status:** Locked  
**Version:** 1.0

---

## States (Exact Names)

Privxx uses exactly **three states**. Do not add intermediate states.

| State | Description |
|-------|-------------|
| `idle` | Default state. Nothing active. User ready to connect. |
| `connecting` | User clicked Connect. Session being established. |
| `connected` | Private tunnel established. User is protected. |

---

## State Transitions

```
┌─────────┐    Click Connect    ┌─────────────┐    Session Ready    ┌───────────┐
│  idle   │ ─────────────────▶  │ connecting  │ ─────────────────▶  │ connected │
└─────────┘                     └─────────────┘                     └───────────┘
     ▲                                                                    │
     │                          Disconnect / Reset                        │
     └────────────────────────────────────────────────────────────────────┘
```

---

## UI Changes Per State

### 🟢 Idle (Default)

| Element | Appearance |
|---------|------------|
| Button | "Connect through Privxx" (enabled) |
| Status Pill | "Idle" with neutral styling |
| Background | Subtle glow only, nothing animating |
| User Feeling | "I'm ready when I want." |

### 🟡 Connecting

| Element | Appearance |
|---------|------------|
| Button | "Connecting…" (disabled) |
| Status Pill | Animated gradient (teal pulse) |
| Background | Very subtle, slow motion |
| User Feeling | "Something serious is happening." |

**Banned:**
- ❌ Fake progress bars
- ❌ Percentages
- ❌ Spinning loaders

### 🔵 Connected (Secure)

| Element | Appearance |
|---------|------------|
| Button | "Connected" (shows completion) |
| Status Pill | "Secure" with solid indicator |
| Background | Motion stops, settled state |
| User Feeling | "I'm protected now." |

**Optional:** One soft confirmation pulse (once only).

---

## Demo Mode Truth Rules

**Non-negotiable:** Privxx never lies about its capabilities.

### During Phase 1 (Simulated)

- Footer displays: `"Demo mode — routing simulated"`
- Privacy drawer includes transparency note about current status
- Never claim "encrypted", "quantum-secure", or "real cMixx" while simulated

### After cMixx Integration (Real)

- Remove demo notice
- States map directly to real session lifecycle:
  - `connecting` → real mixnet handshake
  - `connected` → real tunnel established

---

## Mapping to cMixx Integration

The state machine is designed to map 1-to-1 with real cMixx sessions:

| UI State | cMixx Equivalent |
|----------|------------------|
| `idle` | No session |
| `connecting` | xxDK initializing, session opening |
| `connected` | cMixx session active, messages routing |

No UI redesign needed when real integration occurs.
