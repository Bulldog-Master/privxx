# Privxx Roadmap (Public)

```mermaid
flowchart TB
  P0[Phase 0: Foundation] --> P1[Phase 1: Demo Messaging]
  P1 --> P2[Phase 2: Intent + Policy]
  P2 --> P3[Phase 3: Messaging Design]
  P3 --> P4[Phase 4: Backend Hardening]
  P4 --> P5[Phase 5: Messaging + Tunnel]
  P5 --> P6[Phase 6: Mobile/Desktop Packaging]

  subgraph Phase_0 [Phase 0: Foundation]
    A0[Frontend: UI/UX + i18n + PWA]:::done
    B0[Bridge-only architecture lock]:::done
    C0[Diagnostics foundation]:::done
  end

  subgraph Phase_1 [Phase 1: Demo Messaging]
    A1[Identity: create/unlock/lock UX]:::done
    B1[Inbox polling + dedupe]:::done
    C1[Compose: send-to-self roundtrip]:::done
    D1[Demo script + diagnostics copy]:::done
  end

  subgraph Phase_2 [Phase 2: Intent + Policy]
    A2[Browser anomaly signals]:::done
    B2[Policy engine stub]:::done
    C2[Payment intent stub]:::done
    D2[Docs + diagrams]:::done
  end

  subgraph Phase_3 [Phase 3: Messaging Design]
    A3[Frontend orchestration lock]:::done
    B3[Conversation derivation]:::done
    C3[Inbox polling (auth-gated)]:::done
    D3[Thread view behavior]:::done
  end

  subgraph Phase_4 [Phase 4: Backend Hardening]
    A4[Bridge + Backend Core separation]:::done
    B4[Health endpoints hardened]:::done
    C4[No backend exposure]:::done
    D4[Architecture locked]:::done
  end

  subgraph Phase_5 [Phase 5: Messaging + Tunnel]
    A5[Messaging enablement]:::todo
    B5[Tunnel capability]:::todo
    C5[Decryption in Backend Core]:::todo
  end

  subgraph Phase_6 [Phase 6: Packaging]
    A6[PWA polish + store readiness]:::todo
    B6[Capacitor/Tauri packaging]:::todo
    C6[Device UX tuning]:::todo
  end

  classDef done fill:#22c55e,color:#fff;
  classDef doing fill:#eab308,color:#000;
  classDef todo fill:#94a3b8,color:#111;
```

## Status Labels

| Label | Meaning |
|-------|---------|
| 🟢 done | Implemented and locked |
| 🟡 doing | In progress |
| ⚪ todo | Planned |

## Phase Details

### Phase 0: Foundation ✅ LOCKED

- Frontend UI/UX complete with 16-language i18n
- PWA install support
- Bridge-only architecture locked
- Diagnostics foundation in place

### Phase 1: Demo Messaging ✅ LOCKED

- Identity create/unlock/lock UX complete
- Inbox polling and deduplication complete
- Compose panel with send-to-self roundtrip
- Demo script and diagnostics copy finalized

### Phase 2: Intent + Policy ✅ LOCKED

- Browser anomaly signals implemented
- Policy engine stub (allow-all) in place
- Payment intent abstraction stub ready
- Documentation and diagrams complete

### Phase 3: Messaging Design ✅ LOCKED

- Frontend orchestration locked
- Conversation derivation from inbox/thread queues
- Auth-gated inbox polling with tab-visibility
- Thread view behavior finalized
- Nicknames (local-only) implemented

### Phase 4: Backend Hardening ✅ LOCKED

- Architecture: Frontend → Bridge (:8090) → Backend Core (:8091)
- Bridge /health endpoint hardened (Cache-Control: no-store)
- Backend Core not internet-facing (localhost only)
- No backend-only routes exposed via Bridge
- Phase 4 lock rules in effect

### Phase 5: Messaging + Tunnel 📋 NEXT

- Messaging enablement on hardened foundation
- Tunnel capability activation
- Decryption implemented in Backend Core
- Capability-gated feature rollout

### Phase 6: Mobile/Desktop Packaging 📋 FUTURE

- PWA polish for app store readiness
- Capacitor/Tauri packaging exploration
- Device-specific UX tuning
