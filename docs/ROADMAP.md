# Privxx Roadmap (Public)

```mermaid
flowchart TB
  P0[Phase 0: Foundation] --> P1[Phase 1: Demo Messaging]
  P1 --> P2[Phase 2: Intent + Policy]
  P2 --> P3[Phase 3: Secure Payments + Enforcement]
  P3 --> P4[Phase 4: Mobile/Desktop Packaging]

  subgraph Phase_0 [Phase 0: Foundation]
    A0[Frontend: UI/UX + i18n + PWA]:::done
    B0[Bridge-only architecture lock]:::done
    C0[Diagnostics foundation]:::done
  end

  subgraph Phase_1 [Phase 1: Demo Messaging]
    A1[Identity: create/unlock/lock UX]:::done
    B1[Inbox polling + dedupe]:::doing
    C1[Compose: send-to-self roundtrip]:::doing
    D1[Demo script + diagnostics copy]:::done
  end

  subgraph Phase_2 [Phase 2: Intent + Policy]
    A2[Browser anomaly signals]:::done
    B2[Policy engine stub]:::done
    C2[Payment intent stub]:::done
    D2[Docs + diagrams]:::doing
  end

  subgraph Phase_3 [Phase 3: Enforcement]
    A3[Bridge auth hardening]:::todo
    B3[Rate limits + request caps]:::todo
    C3[Payment rails abstraction]:::todo
    D3[Policy decisions]:::todo
  end

  subgraph Phase_4 [Phase 4: Packaging]
    A4[PWA polish + store readiness]:::todo
    B4[Capacitor/Tauri packaging]:::todo
    C4[Device UX tuning]:::todo
  end

  classDef done fill:#22c55e,color:#fff;
  classDef doing fill:#eab308,color:#000;
  classDef todo fill:#94a3b8,color:#111;
```

## Status Labels

| Label | Meaning |
|-------|---------|
| 🟢 done | Implemented and merged |
| 🟡 doing | In progress |
| ⚪ todo | Planned |

## Phase Details

### Phase 0: Foundation ✅

- Frontend UI/UX complete with 16-language i18n
- PWA install support
- Bridge-only architecture locked
- Diagnostics foundation in place

### Phase 1: Demo Messaging 🟡

- Identity create/unlock/lock UX complete
- Inbox polling and deduplication in progress
- Compose panel with send-to-self roundtrip
- Demo script and diagnostics copy finalized

### Phase 2: Intent + Policy 🟡

- Browser anomaly signals implemented
- Policy engine stub (allow-all) in place
- Payment intent abstraction stub ready
- Documentation and diagrams in progress

### Phase 3: Secure Payments + Enforcement 📋

- Bridge authentication hardening (JWT/Access)
- Rate limits and request caps
- Payment rails abstraction
- Policy decisions (warn/reauth/deny)

### Phase 4: Mobile/Desktop Packaging 📋

- PWA polish for app store readiness
- Capacitor/Tauri packaging exploration
- Device-specific UX tuning
