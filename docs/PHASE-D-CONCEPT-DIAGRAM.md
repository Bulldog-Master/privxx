# Phase D Concept Diagram (cMixx Proof — Control Channel First)

## Purpose
This diagram defines the Phase D architecture at a conceptual level.
It is intentionally minimal to prove real cMixx integration while keeping the UI locked.

Phase D is **control-channel first**:
- Connect intent and status messages traverse cMixx
- Secure state is triggered by a real cMixx event
- Full browsing/proxy routing is explicitly out of scope

---

## Diagram Title
**Privxx Phase D — cMixx Control-Channel Proof**

---

## Diagram Nodes (Blocks)

### A) User Device
Label: **User (iOS/Android/Web/PWA)**
- Enters URL
- Presses Connect

### B) Privxx UI (Locked)
Label: **Privxx UI (Locked Experience Layer)**
- URL input field
- Connect button
- Status: Idle → Connecting → Secure
- Privacy drawer

**Note:** UI visuals must not change during Phase D.

### C) Privxx Control Channel Client
Label: **Privxx Control-Channel Client**
- Builds a connection intent message:
  - target URL
  - session ID
  - timestamp (optional)
- Sends/receives messages through xxDK/cMixx
- Emits a "connected" event when a reply is received

### D) xxDK / cMixx Layer
Label: **xxDK / cMixx Mixnet**
- Provides metadata-resistant message transport
- Mixes traffic to reduce correlation
- Returns reply messages back to the client

### E) Privxx Listener (Server)
Label: **Privxx Listener (Minimal Server)**
- Receives control-channel message over cMixx
- Validates message structure
- Responds with acknowledgement:
  - ack: true
  - session ID
  - status: connected

### F) Event → UI State Transition
Label: **Secure State Trigger**
- Trigger condition:
  - "Valid ACK received over cMixx"
- Action:
  - UI transitions from Connecting → Secure

---

## Diagram Connections (Arrows)

1) **User → Privxx UI**
Arrow label: "Enter URL / Tap Connect"

2) **Privxx UI → Control-Channel Client**
Arrow label: "Create connection intent"

3) **Control-Channel Client → xxDK / cMixx**
Arrow label: "Send intent message (cMixx)"

4) **xxDK / cMixx → Privxx Listener**
Arrow label: "Deliver intent message"

5) **Privxx Listener → xxDK / cMixx**
Arrow label: "Send ACK reply (cMixx)"

6) **xxDK / cMixx → Control-Channel Client**
Arrow label: "Receive ACK reply"

7) **Control-Channel Client → Secure State Trigger → Privxx UI**
Arrow label: "Event-driven: Connecting → Secure"

---

## Phase D In Scope (Explicit)
✅ Real cMixx connectivity for control-channel messaging  
✅ Listener receives message and replies  
✅ Secure state triggered by real cMixx event  
✅ Logging (client + server) proving send/receive  
✅ UI remains unchanged

---

## Phase D Out of Scope (Explicit)
❌ Full HTTP proxy routing over cMixx  
❌ Payments settlement logic  
❌ Wallet integration  
❌ Production anonymity claims  
❌ Performance tuning beyond basic feasibility  
❌ UI redesign / style changes

---

## Evidence Required
Phase D success must produce:
- Screenshot: Connecting
- Screenshot: Secure
- Client log showing send + receive
- Server log showing receive + reply

Use: `PHASE-D-SUCCESS-LOG-TEMPLATE.md`

---

## Rendering Notes (If converting to a visual diagram later)
- Use a simple left-to-right layout:
  **User/Device → UI → Control Client → cMixx → Listener → cMixx → Control Client → UI**
- Use two swimlanes:
  1) **User Device (UI + Client)**
  2) **Network + Server (cMixx + Listener)**
- Include an "Out of Scope" box off to the side listing excluded items.
