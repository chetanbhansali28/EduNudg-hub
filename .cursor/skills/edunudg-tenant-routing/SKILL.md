---
name: edunudg-tenant-routing
description: Host-based tenant resolution and portal routing for EduNudg.
---

# Tenant Routing

## Flow

1. `packages/tenant` resolves hostname → `domain_mappings`
2. `TenantProvider` in `apps/web/src/bootstrap/`
3. React Router mounts platform `/admin`, brand, or center tree

## Files

- `packages/tenant/src/resolveTenant.ts`
- `apps/web/src/routes/*.tsx`
- `vercel.json` SPA rewrites

## Local dev

- App URL: `http://localhost:9000` (fixed port; see `apps/web/vite.config.ts`)
- Use `/etc/hosts` for brand/center subdomains with `:9000`
- Or `VITE_DEFAULT_PORTAL=platform` fallback in `.env`
