# EduNudg Operations Runbook

## Local development (no Docker)

- **Frontend**: Vite on http://localhost:9000 (`pnpm dev`)
- **Backend**: [Supabase Cloud](https://supabase.com) — direct connection via `VITE_SUPABASE_URL` + anon key

Do **not** run `supabase start` (that requires Docker Desktop).

```bash
pnpm install
cp .env.example apps/web/.env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase Dashboard → API
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
pnpm dev
```

Full setup: [supabase-cloud-setup.md](./supabase-cloud-setup.md)

### URLs (port 9000)

| URL | Portal |
|-----|--------|
| http://localhost:9000/ | Platform marketing homepage (shared nav + footer) |
| http://localhost:9000/login | Platform admin / staff login (split-screen UI) |
| http://localhost:9000/admin | Platform app (Command Center KPIs) |
| http://localhost:9000/admin/brands | Brands list — **Brand backend** opens target brand `/app`; **Edit** → brand detail |
| http://localhost:9000/admin/brands/:slug | Brand detail — performance KPIs, settings, domains, centers |
| http://localhost:9000/admin/revenue | Revenue & usage KPIs |
| http://localhost:9000/admin/homepage | Platform marketing homepage editor |
| http://abacusworld.localhost:9000/ | Abacus World franchise landing (public) |
| http://smart-brain-abacus.localhost:9000/ | Smart Brain Abacus (Abacus Classic theme) |
| http://abacusworld.localhost:9000/login | Brand staff login |
| http://abacusworld.localhost:9000/app | Brand operator backend (compact KPI dashboard) |
| http://abacusworld.localhost:9000/app/analytics | Brand analytics KPIs |
| http://{brand}.localhost:9000/auth/handoff | Platform-admin cross-portal sign-in (token in query) |
| http://koramangala.abacusworld.localhost:9000/ | Center parent enrollment landing (public) |
| http://koramangala.abacusworld.localhost:9000/login | Center staff login |
| http://koramangala.abacusworld.localhost:9000/app | Center operations dashboard |
| http://learn.abacusworld.localhost:9000/login | Student login (white-label) |

**Marketing landing UI** (shared nav, hero, feature phone stage, footer): see [marketing-landing.md](../frontend/marketing-landing.md). On mobile/tablet, nav CTA is right-aligned; feature blocks snap one per screen.

**White-label copy** (optional): in `brand_settings.settings` JSON, set `login_headline` and `login_subtext`. Requires migration `011_portal_branding_public.sql` (`supabase db push`).

Hosts (add to `/etc/hosts`):

```
127.0.0.1 localhost admin.localhost abacusworld.localhost koramangala.abacusworld.localhost learn.abacusworld.localhost smart-brain-abacus.localhost
```

### Platform admin cross-portal access

Signed-in platform admin can open **Brand backend** or **Open** on brand detail domains to land on another host’s `/app` (or learn/parents `/`). Uses Edge Function `platform-portal-handoff` and `/auth/handoff` — see [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md).

### Supabase Dashboard (Auth)

**Authentication → URL configuration**

- Site URL: `http://localhost:9000` (not `localhost:3000`)
- Redirect URLs: `http://localhost:9000/**`

## Deploy (Vercel)

1. Link repo to Vercel (Root Directory: `apps/web`)
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same cloud project or production project)
3. **Portal hosts** — pick one:
   - **Same-origin (default on `*.vercel.app`)**: leave `VITE_PORTAL_BASE_DOMAIN` unset. Brand / Franchise / Student portals open on the same URL with `?portal=&brand=` (and `center=` when needed). Platform **Brand backend** handoff uses this automatically.
   - **Real multi-host**: set `VITE_PORTAL_BASE_DOMAIN=yourdomain.com`, add wildcard DNS `*.yourdomain.com` → Vercel, and map hosts in `domain_mappings` (seed rows still use `*.localhost` for local; the SPA rewrites them when the base domain is set).
4. Supabase Auth → add production Site URL / Redirect URLs for `https://edunudg-hub.vercel.app/**` (and custom domains when used)

### Deploy (GitHub Actions CD)

Production and PR previews deploy via [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml) (Vercel CLI + `--prebuilt`). Automatic Git deploys are disabled in `apps/web/vercel.json` so only Actions ships builds.

**One-time secrets** (repo → Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | [Vercel → Account → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | After `vercel link` in this repo: `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Same file → `projectId` |

```bash
# From repo root (uses Root Directory apps/web on the linked project)
pnpm dlx vercel@latest login
pnpm dlx vercel@latest link
# Copy orgId + projectId from .vercel/project.json into GitHub secrets (do not commit .vercel/)
```

Optional: create a GitHub Environment named **`production`** (Settings → Environments) if you want required reviewers before prod deploys.

| Event | Behavior |
|-------|----------|
| Pull request | Preview deploy + PR comment with URL |
| CI success on `main` / `master` | Production deploy (`workflow_run` after [CI](../../.github/workflows/ci.yml)) |

## Migrations

```bash
supabase migration new my_change
supabase db push
```

## Tests

```bash
pnpm test
pnpm audit:schema
pnpm test:e2e
pnpm ci:local   # full GitHub CI mirror — required before push (see edunudg-pre-push-ci)
```

RLS SQL tests (optional, against cloud DB):

```bash
export DATABASE_URL="postgresql://..."   # from Dashboard → Database
pnpm test:rls
```

## Marketing homepage & brand themes

- Public config key: `platform_settings.marketing_homepage` (migration `009_marketing_homepage.sql`)
- Anonymous users can **read**; platform admins can **read/write** via RLS
- Edit platform homepage at **Platform → Homepage** (`/admin/homepage`) after signing in as `admin@edunudg.com`
- **Brand marketing themes** (Novu / Abacus Classic / Spark Academy) are assigned on **Platform → Brands → Edit** → **Brand settings** → **Website theme**
- Upload hero, highlight, and feature videos via file pickers in the editor (stored in Supabase `brand-assets`)
- Brand owners edit page **content** at `{brand}.localhost:9000/app/homepage`

## Merchandise product photos

- Enable **`merchandise`** on platform **Brand detail** → Features (or `brand_settings.settings.features.merchandise`).
- Apply migration `045_merchandise_catalog_photos.sql`: `supabase db push`
- Brand staff: **Brand portal → Merchandise → Catalog** — add SKUs, then upload up to **5 photos per product** (PNG/JPEG/WebP/GIF, 5 MB).
- Storage path: `{brand_id}/merchandise/{catalog_item_id}/photo-{1-5}.{ext}` in the **`brand-assets`** bucket (re-upload to a slot replaces that slot).
- Franchise centers see photos on **Center portal → Merchandise → Shop**.

See [merchandise spec](../spec/merchandise.md).

## Center public profile (franchise settings)

- Apply migration `046_center_public_profile.sql`: `supabase db push`
- Franchise staff: **Center portal → Settings** (`/app/settings`) — update photo, address, phone, and social links. Sign-in email comes from Google/social auth; public site URL is the center marketing host (no separate website field).
- Center photo storage: `{brand_id}/centers/{center_id}/photo.{ext}` in **`brand-assets`** bucket.
- Changes appear on the center public site (`{center}.{brand}.localhost:9000`) via `get_center_landing_public`.

```bash
supabase db push   # applies 009 if not yet applied
```

## OAuth (Google / Facebook)

Configure in **Supabase Dashboard → Authentication → Providers** when ready. No local `config.toml` changes required for cloud.

## OpenSpec (behavioral specs)

EduNudg uses [OpenSpec](https://openspec.dev/) for testable requirements and change proposals. Reference docs stay in `docs/`; behavior lives in `openspec/specs/`.

**Requirements:** Node.js ≥ 20.19.

```bash
pnpm install                    # includes @fission-ai/openspec devDependency
pnpm openspec:update            # refresh Cursor /opsx:* slash commands
pnpm exec openspec list         # active changes
pnpm exec openspec validate --all --strict
pnpm exec openspec archive <change-name> -y
```

**Cursor workflow:** `/opsx:propose` → review artifacts in `openspec/changes/` → `/opsx:apply` → `/opsx:archive`.

**Telemetry opt-out (optional):** `export OPENSPEC_TELEMETRY=0` or `export DO_NOT_TRACK=1`.

See [`openspec/README.md`](../../openspec/README.md) and [`docs/agent-playbook/README.md`](../agent-playbook/README.md).

## Security

- Never commit `service_role` key or `DATABASE_URL` to git
- Verify RLS after every migration
- Use anon key only in the browser
