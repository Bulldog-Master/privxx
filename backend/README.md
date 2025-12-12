# Privxx Backend

This folder contains the future backend components of Privxx.

## Phase 1 — Simulation Only

The current front-end simulates behavior.  
No actual networking or mixnet integration exists yet.

## Phase 2 — Real Mixnet Integration (Planned)

The backend will eventually include:

- A **Privxx Proxy Server**
  - Acts as an xxDK client
  - Receives encrypted requests from the Privxx client
  - Forwards requests to external HTTPS sites
  - Sends responses back through the mixnet

- Message format specifications for:
  - Client to Proxy
  - Proxy to Client

- A privacy-first implementation
  - No logging of metadata
  - No analytics
  - Minimal headers
  - No persistent identifiers

This backend will be developed after initial concept validation.
