# Privxx Diagnostics View (Frontend-Only)

## Purpose

The Diagnostics view provides **simple, user-friendly visibility** into the current application state without exposing technical or sensitive details.

This view reduces confusion during preview mode and minimizes support questions once backend integration begins.

---

## DESIGN PRINCIPLES

- Read-only
- Non-technical language
- No backend internals
- No identifiers, versions, nodes, or logs
- Same UI works in demo and live modes

---

## LOCATION IN UI

- Accessible from:
  - Settings
  - Status screen
  - Footer link ("Status")

Label: **"Status"** or **"Diagnostics"**

---

## DISPLAYED FIELDS (SAFE)

### 1️⃣ Application Mode
**Label:** Mode  
**Values:**
- Preview (Demo)
- Live

**Source:** Frontend mock/live flag

---

### 2️⃣ Backend Status
**Label:** Backend  
**Values:**
- Online
- Starting
- Offline

**Source:** `/api/backend/status`

---

### 3️⃣ Network Features
**Label:** Network Routing  
**Values:**
- Preview
- Active (future)

No mention of:
- Gateways
- Mix nodes
- cMixx internals
- NDF

---

### 4️⃣ Messaging
**Label:** Messaging  
**Values:**
- Coming soon
- Enabled (future)

---

## EXAMPLE UI (TEXT)

```
Status

Mode: Preview
Backend: Online
Network Routing: Preview
Messaging: Coming soon
```

---

## WHAT MUST NOT APPEAR

🚫 The Diagnostics view must NEVER show:
- IP addresses
- Node counts
- Gateway names
- Versions
- Errors or stack traces
- Cryptographic terms
- Debug output

---

## ERROR HANDLING

If backend status cannot be fetched:
- Show: "Backend: Offline"
- Provide a "Retry" button
- Do not show error details

---

## FUTURE EXTENSION (OPTIONAL)

Once backend is live, this view may add:
- Last connected time
- Simple uptime indicator

Only if:
- Non-identifying
- Non-technical
- User-understandable

---

## SUMMARY

The Diagnostics view exists to:
- Increase transparency
- Reduce confusion
- Maintain privacy guarantees
- Support preview → live transition

It is not a developer console.
