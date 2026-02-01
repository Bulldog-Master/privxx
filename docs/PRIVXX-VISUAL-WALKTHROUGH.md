# Privxx – Visual Walkthrough (Phase 1 Simulation)

This guide explains how the Privxx prototype behaves today.

Even though Privxx will eventually route traffic through the xx Network (cMixx), this version **simulates all network functionality**.

---

## 1. Opening the Privxx App

When you open Privxx, you see:
- A dark privacy-themed interface
- The title **Privxx**
- Subtitle: *Private Tunnel*
- A single URL input field
- A large "Connect through Privxx" button

This minimal UI reflects the "privacy-first" philosophy.

---

## 2. Entering a Website URL

You can paste any URL, such as:
- `https://example.com`
- `https://amazon.com`
- `https://yourbank.com`

Privxx will simulate what the future full version would do:

→ Take your request  
→ Route it through the mixnet  
→ Deliver it anonymously  
→ Fetch the result  
→ Return it back through the mixnet  

In this prototype, it **simulates that process visually**.

---

## 3. Clicking "Connect through Privxx"

When you click the button:

1. The status changes to **"Connecting through Privxx…"**
2. A small spinner appears
3. A randomized delay of **2–3 seconds** simulates mixnet routing
4. Then the status changes to: **"Connected (simulated)"**
5. A simulated round-trip latency appears:
   - e.g., **1287 ms**
   - (Random between 500–2500 ms)

This recreates the feeling of:
- Encryption
- Mixnet batching
- Multi-hop routing
- Proxy processing

...without the backend yet.

---

## 4. Viewing the Simulated Result

Below the card, Privxx shows:
- **Requested URL:** (your URL)
- **Simulated latency:** (random ms)
- A block of text: *"Proxied content will appear here in a future version."*

This is where real website content will render after Phase 2.

---

## 5. Opening the Privacy Drawer

Clicking **Privacy** in the upper-right opens a side panel showing:

- Privxx hides your IP and location
- Privxx removes metadata with cMixx
- Privxx uses post-quantum-safe cryptography
- Privxx stores no history or tracking IDs
- Privxx never uses analytics

This reinforces what Privxx is really about.

---

## 6. Understanding the Simulation

⚠️ **This version is not yet private.**

It simulates:
- Mixnet routing delays
- Request flow
- Status feedback

But it does **not yet use**:
- xxDK
- Real cMixx routing
- Real proxy infrastructure
- Real encryption

This simulation phase exists so you can:
- Validate the concept
- Validate the UI
- Show others the idea
- Prepare for backend development
- Avoid wasted dev time

---

## 7. Future Behavior (Phase 2+)

When real cMixx integration arrives:

You will:
1. Enter a URL
2. Privxx will encrypt the request
3. It will travel through cMixx
4. The Privxx Proxy will fetch the real website
5. Privxx will decrypt and display the page

The UI will remain mostly the same — it's already designed for this.
