# Privxx Backend-Live Runbook

## Goal

Safely transition from Preview (mock mode) to Live backend without regressions.

---

## Preconditions (ALL REQUIRED)

Before proceeding with cutover, verify:

- [ ] XX team confirms supported client + NDF
- [ ] Backend stable for ≥ 48 hours
- [ ] Proxy endpoints deployed and tested
- [ ] Readiness panel in Diagnostics shows:
  - Proxy reachable: Yes
  - Backend ready: Yes
  - Mode: Preview

---

## Cutover Steps (STRICT ORDER)

### Step 1: Set Environment

```bash
VITE_USE_MOCKS=false
```

### Step 2: Rebuild Frontend

```bash
npm run build
```

### Step 3: Deploy Frontend

Deploy the built assets to production.

### Step 4: Verify Diagnostics

Open the app and check Diagnostics panel:
- Mode: **Live**
- Backend: **Online**

### Step 5: Functional Verification

- [ ] Install prompt still works (PWA)
- [ ] No "Demo" or "Preview" labels remain visible
- [ ] Messaging shows correct state
- [ ] Privacy drawer content unchanged

### Step 6: Monitor

Watch for 60 minutes post-deployment.

---

## Success Criteria

- No client-side errors in console
- No stale or incorrect status displays
- No privacy regressions (no new claims)
- No user confusion or misleading UI

---

## Rollback Conditions

**Rollback immediately if:**

- Backend becomes unstable
- Proxy errors leak to UI
- UI shows success when backend is failing
- Any privacy-violating content appears

**Rollback Action:**

```bash
# Revert to mock mode
VITE_USE_MOCKS=true

# Rebuild and redeploy
npm run build
# Deploy
```

---

## Important Notes

1. **Frontend must never be modified during cutover** — only environment flags change.
2. **No new privacy claims** — all copy remains conservative.
3. **No telemetry added** — this is a UI-only change.
4. **Reversible** — can rollback at any time without data loss.

---

## Post-Cutover Checklist

- [ ] Verified Mode shows "Live"
- [ ] Verified Backend shows "Online"
- [ ] Confirmed no demo labels visible
- [ ] Checked all languages still work
- [ ] Monitored for 60 minutes
- [ ] No rollback needed

---

## Contact

For issues during cutover, contact the Privxx team immediately.

---

**Privxx Team**  
*Privacy-first by design*
