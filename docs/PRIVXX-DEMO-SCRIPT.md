# Privxx Demo Script (Phase 1 – Simulated Prototype)

This is written as if you're speaking to someone.

---

## 1. One-sentence opener

> "Privxx is a privacy-first tunnel for browsing and payments that hides your metadata using mixnets and post-quantum crypto — this prototype shows how the user experience will feel."

---

## 2. Show the main screen

1. Open the Privxx app.
2. Point out:
   - The title: **"Privxx"**
   - The subtitle: **"Private Browsing & Payments Tunnel"**
   - The URL bar
   - The **'Connect through Privxx'** button
   - The language selector (EN / ES / FR / PT / DE / etc.)

**Say:**

> "The idea is simple: paste any bank, merchant, or website URL here and Privxx will route it through a privacy tunnel instead of a normal connection."

---

## 3. Show language support (very briefly)

1. Click a few languages in the selector (e.g. ES, FR, ZH, AR).
2. Let them see the whole UI switch (header, button, status, privacy drawer, footer disclaimer).

**Say:**

> "Privxx is designed to be global from day one, so the interface works in the major world languages — including RTL ones like Arabic and Urdu."

*(Then switch back to English for the rest of the demo unless they prefer otherwise.)*

---

## 4. Run a "fake" private connection

1. In the URL field, type something like:
   - `https://yourbank.com`
   - or `https://amazon.com`
2. Click **"Connect through Privxx."**

**Walk them through what happens:**

- Status changes from **"Idle"** → **"Connecting through Privxx…"**
- Spinner shows, 2–3 second simulated delay
- Then **"Connected (simulated)"**
- **"Requested URL"** shows the URL they entered
- **"Simulated latency: XXXX ms"** is displayed
- Placeholder text: *"Proxied content will appear here in a future version."*

**Say:**

> "Here we're simulating what a real cMixx-based tunnel will feel like: a bit of latency, but with strong metadata protection. In the real version, this step will actually go through the xx Network."

---

## 5. Open the Privacy drawer

1. Click the **Privacy** button.
2. Read/point at the bullets (IP hiding, metadata removal, post-quantum crypto, no history, no tracking).

**Say:**

> "Privxx isn't just 'encrypted'. It's designed around metadata: hiding IP and location, stripping network patterns via cMixx, and using post-quantum-safe cryptography. This drawer is basically the product's bill of rights."

Close the drawer.

---

## 6. Highlight the disclaimer (simulation vs real)

Scroll/look at the footer where `simulationNotice` shows (in their language).

**Say:**

> "Right now this is a simulated prototype. The flows, language, and UX are real, but the network path is still a placeholder. The next phase is to plug this into an actual cMixx + xxDK backend so this button really does route traffic privately."

---

## 7. Close with what's next

> "Phase 2 is very simple:
> – Build a small Privxx Proxy that talks to xxDK and forwards HTTPS
> – Wire this front-end into that proxy over cMixx
> Once that works even for a handful of sites — like one bank + one merchant — we'll know Privxx is technically viable as a privacy tunnel."

---

## Demo Timing

| Section | Time |
|---------|------|
| Opener | 10 sec |
| Main screen tour | 30 sec |
| Language demo | 20 sec |
| Fake connection | 45 sec |
| Privacy drawer | 30 sec |
| Disclaimer | 15 sec |
| What's next | 30 sec |
| **Total** | **~3 min** |

---

## Tips

- Keep it under 3–4 minutes for a casual demo.
- Let them click around themselves if they want.
- Emphasize: **"This is the UX vision. The real privacy comes when we wire in xxDK."**
