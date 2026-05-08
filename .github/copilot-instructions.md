# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```

---

# Pre-commit Gate — Zero-Rework Policy

Every commit runs `lint-staged`. **Copilot must ensure all checks pass before finishing any task.**

## Checks that run on commit

| Trigger | Command |
|---|---|
| `backend/src/**/*.ts` changed | `cd backend && npx prisma generate --silent && npx tsc --noEmit` |
| `frontend/src/**/*.{ts,tsx,js,jsx}` changed | `cd frontend && eslint --max-warnings=0` |

## Mandatory workflow after every code change

After editing any file, run the relevant check immediately and fix all errors before considering the task done:

```bash
# Backend changes
rtk cd backend && npx prisma generate --silent && npx tsc --noEmit

# Frontend changes
rtk cd frontend && node_modules/.bin/eslint --max-warnings=0 src
```

## Known failure patterns and fixes

### `Module '"@prisma/client"' has no exported member 'PrismaClient'`
**Cause:** Prisma schema was changed but `prisma generate` was not re-run.  
**Fix:** `cd backend && npx prisma generate`  
**Rule:** Always run `prisma generate` after any edit to `prisma/schema.prisma`.

### `Parameter 'x' implicitly has an 'any' type`
**Cause:** Stale generated Prisma types (same root cause as above).  
**Fix:** `cd backend && npx prisma generate`

### `CSS inline styles should not be used`
**Cause:** `style={{ ... }}` used in JSX instead of a CSS class.  
**Fix:** Move the style to the nearest `.css` file and apply a class name.

### ESLint `--max-warnings=0` failures
**Cause:** Any ESLint warning is treated as an error.  
**Fix:** Resolve or suppress with an inline comment; never leave warnings.

## Schema changes — checklist

When editing `backend/prisma/schema.prisma`:
1. Add a migration file under `backend/prisma/migrations/<timestamp>_<name>/migration.sql`
2. Run `cd backend && npx prisma generate` immediately
3. Run `npx tsc --noEmit` to confirm no type errors before moving on
