# Session Log: Temporary Build Server Pattern
**Date:** 2025-12-03 02:20 EST
**Focus:** Infrastructure automation for CPU-intensive builds

---

## Summary

Created a reusable pattern for spinning up temporary high-CPU Vultr instances for resource-intensive operations (like `raindrop build deploy`), then destroying them after completion.

**Problem Solved:** Local laptop overheats during Raindrop builds, causing session crashes.

**Solution:** Offload builds to temporary cloud instances with more CPU power.

---

## What Was Built

### Scripts Created

| Script | Purpose |
|--------|---------|
| `deploy-fast.sh` | Spins up 4-core Vultr instance, syncs code, builds, deploys, destroys |
| `deploy-via-vultr.sh` | Uses existing permanent Vultr server for builds (simpler) |
| `create-build-snapshot.sh` | Creates a pre-configured snapshot for faster boots |
| `setup-vultr-raindrop.sh` | One-time setup for permanent server approach |
| `sync-to-vultr.sh` | Just syncs files without deploying |

### Documentation Created

- `documentation/technical/VULTR_RAINDROP_DEPLOY.md` - Full guide for remote Raindrop deploys

---

## The Pattern: Ephemeral Build Servers

### Architecture

```
Local Machine                    Vultr API                     Cloudflare Workers
     │                               │                               │
     │  1. Create instance           │                               │
     │  ─────────────────────────>   │                               │
     │                               │  (boots 4-core server)        │
     │  2. SSH + sync code           │                               │
     │  ─────────────────────────>   │                               │
     │                               │                               │
     │  3. Run build on remote       │                               │
     │  ─────────────────────────>   │  4. Deploy to production      │
     │                               │  ─────────────────────────>   │
     │  5. Destroy instance          │                               │
     │  ─────────────────────────>   │                               │
     │                               │                               │
```

### Key Implementation Details

**Instance Creation via API:**
```bash
curl -s -X POST "https://api.vultr.com/v2/instances" \
  -H "Authorization: Bearer $VULTR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "ewr",
    "plan": "vc2-4c-8gb",
    "os_id": 2284,
    "sshkey_id": ["your-key-id"],
    "label": "temp-build-server"
  }'
```

**Cleanup on Exit (trap pattern):**
```bash
INSTANCE_ID=""
cleanup() {
  if [ -n "$INSTANCE_ID" ]; then
    curl -s -X DELETE "https://api.vultr.com/v2/instances/$INSTANCE_ID" \
      -H "Authorization: Bearer $VULTR_API_KEY"
  fi
}
trap cleanup EXIT
```

**Snapshot for Faster Boots:**
```bash
# Create snapshot from configured instance
curl -s -X POST "https://api.vultr.com/v2/snapshots" \
  -H "Authorization: Bearer $VULTR_API_KEY" \
  -d '{"instance_id": "xxx", "description": "build-ready"}'

# Boot from snapshot (skip Node.js install)
curl -s -X POST "https://api.vultr.com/v2/instances" \
  -d '{"snapshot_id": "xxx", ...}'
```

---

## Lessons Learned

### What Worked
1. **Vultr API is fast** - Instance creation takes ~30 seconds
2. **4-core instances build quickly** - Much faster than 1-core
3. **Cost is negligible** - ~$0.07 per build (billed by minute)
4. **Cleanup trap pattern** - Prevents orphaned instances on script errors

### What Didn't Work (Yet)
1. **Snapshot boot times** - Snapshots take longer to restore than expected (~3-5 min vs ~1 min for fresh Ubuntu)
2. **SSH readiness** - Need generous timeouts; server "active" doesn't mean SSH is ready
3. **Locked instances** - Can't delete instances while they're booting from snapshots

### Recommendations
1. **For frequent builds (10+/day):** Use permanent $12/mo 2-core server
2. **For occasional builds:** Fresh Ubuntu instance with Node.js install (~2 min total)
3. **Snapshot approach:** Better for complex setups (databases, large dependencies), not for simple Node.js

---

## Environment Variables Added

```bash
# .env additions
VULTR_SSH_KEY_ID=xxx          # Your SSH key ID from Vultr
VULTR_BUILD_SNAPSHOT_ID=xxx   # Optional - snapshot for fast boots
```

---

## Future Applications of This Pattern

This ephemeral server pattern can be reused for:
- **CI/CD pipelines** - Spin up test runners on demand
- **Data processing** - High-memory instances for ETL jobs
- **ML training** - GPU instances for model training
- **Load testing** - Multiple instances for distributed load tests
- **Database migrations** - High-CPU for large schema changes

---

## Files Changed This Session

### New Files
- `deploy-fast.sh` - Ephemeral build server script
- `deploy-via-vultr.sh` - Permanent server deploy script
- `create-build-snapshot.sh` - Snapshot creation script
- `setup-vultr-raindrop.sh` - One-time setup script
- `sync-to-vultr.sh` - File sync only script
- `documentation/technical/VULTR_RAINDROP_DEPLOY.md`

### Modified Files
- `src/admin-dashboard/index.ts` - Added Twilio cost estimation for historical data
- `.env` - Added VULTR_SSH_KEY_ID, VULTR_BUILD_SNAPSHOT_ID

---

## Next Session Priority

### P0 - Must Do
1. Deploy Raindrop services (use `deploy-via-vultr.sh` on permanent server)
2. Redeploy Voice Pipeline
3. Verify cost tracking works

### P1 - Should Do
1. Test LLM model selection persistence
2. Clean up orphaned Vultr instances once unlocked

### Technical Debt
- Snapshot boot time issue needs investigation (or just use permanent server)
- Consider upgrading permanent Vultr to 2-core ($12/mo) for faster builds

---

## Shoutouts
- **Vultr** - Great API, affordable hourly billing, fast instance creation
