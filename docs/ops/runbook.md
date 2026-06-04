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
| http://localhost:9000/admin | Platform app |
| http://localhost:9000/admin/homepage | Homepage editor (platform admin) |
| http://abacusworld.localhost:9000/ | Abacus World franchise landing (public) |
| http://abacusworld.localhost:9000/login | Brand staff login |
| http://abacusworld.localhost:9000/app | Brand operator backend |
| http://koramangala.abacusworld.localhost:9000/ | Center parent enrollment landing (public) |
| http://koramangala.abacusworld.localhost:9000/login | Center staff login |
| http://koramangala.abacusworld.localhost:9000/app | Center operations dashboard |
| http://learn.abacusworld.localhost:9000/login | Student login (white-label) |

**Marketing landing UI** (shared nav, hero, feature phone stage, footer): see [marketing-landing.md](../frontend/marketing-landing.md). On mobile/tablet, nav CTA is right-aligned; feature blocks snap one per screen.

**White-label copy** (optional): in `brand_settings.settings` JSON, set `login_headline` and `login_subtext`. Requires migration `011_portal_branding_public.sql` (`supabase db push`).

Hosts (add to `/etc/hosts`):

```
127.0.0.1 localhost admin.localhost abacusworld.localhost koramangala.abacusworld.localhost
```

### Supabase Dashboard (Auth)

**Authentication → URL configuration**

- Site URL: `http://localhost:9000`
- Redirect URLs: `http://localhost:9000/**`

## Deploy (Vercel)

1. Link repo to Vercel
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same cloud project or production project)
3. Add custom domains per `domain_mappings`

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
```

RLS SQL tests (optional, against cloud DB):

```bash
export DATABASE_URL="postgresql://..."   # from Dashboard → Database
pnpm test:rls
```

## Marketing homepage

- Public config key: `platform_settings.marketing_homepage` (migration `009_marketing_homepage.sql`)
- Anonymous users can **read**; platform admins can **read/write** via RLS
- Edit at **Platform → Homepage** (`/admin/homepage`) after signing in as `admin@edunudg.com`
- Typography follows [Novu on One Page Love](https://onepagelove.com/novu): DM Sans + Instrument Serif (substitutes for Messina + Victor Serif)
- Live site reference: [withnovu.com](https://www.withnovu.com/)

```bash
supabase db push   # applies 009 if not yet applied
```

## OAuth (Google / Facebook)

Configure in **Supabase Dashboard → Authentication → Providers** when ready. No local `config.toml` changes required for cloud.

## Security

- Never commit `service_role` key or `DATABASE_URL` to git
- Verify RLS after every migration
- Use anon key only in the browser
