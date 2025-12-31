# Cutover Runbook

This runbook covers transitioning from Demo/Preview mode to Live mode.

## Prerequisites

- [ ] Backend service stable for 24+ hours
- [ ] Bridge API responding correctly
- [ ] cMixx network connectivity verified
- [ ] All diagnostics green
- [ ] E2E test suite passing

## Pre-Cutover Checklist

### Infrastructure

- [ ] Proxy configured with production SSL
- [ ] Bridge rate limits tuned
- [ ] Backend resource allocation verified
- [ ] Monitoring and alerting configured

### Application

- [ ] Demo mode flag removable
- [ ] Production environment variables set
- [ ] Error handling covers production scenarios
- [ ] Logging configured for production

### Documentation

- [ ] User-facing docs updated
- [ ] Support runbook prepared
- [ ] Incident response plan documented

## Cutover Steps

### 1. Final Verification (30 min)

```bash
# Run E2E test suite
npm run test:e2e

# Verify Bridge health
curl -s https://privxx.app/health | jq

# Check all diagnostics
# (manual verification in app)
```

### 2. Update Configuration (5 min)

```bash
# Remove demo mode flag
VITE_MOCK=false

# Verify production Bridge URL
VITE_BRIDGE_URL=https://privxx.app
```

### 3. Deploy (10 min)

```bash
npm run build
# Deploy to production
```

### 4. Post-Deploy Verification (15 min)

- [ ] Landing page loads
- [ ] Diagnostics show all green
- [ ] Identity unlock works
- [ ] Send-to-self roundtrip works
- [ ] Inbox receives messages

## Rollback Plan

If issues occur:

1. Revert to previous deployment
2. Re-enable demo mode (`VITE_MOCK=true`)
3. Investigate root cause
4. Document findings

## Post-Cutover

- [ ] Monitor error rates for 24 hours
- [ ] Review user feedback
- [ ] Update status page
- [ ] Announce transition complete
