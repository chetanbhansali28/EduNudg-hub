## Why

Center public profile (photo, address, phone, social links) shipped in migration `046_center_public_profile.sql` needs a canonical OpenSpec capability before customer UAT. Documenting expected behavior in GIVEN/WHEN/THEN form lets humans and agents validate the settings → public site data flow without ambiguity.

## What Changes

- Add `center-public-profile` behavioral spec covering franchise settings UI and public landing payload
- Confirm existing implementation (`CenterSettingsPage`, `update_center_public_profile_rpc`, `get_center_landing_public`) matches documented scenarios
- No breaking API or schema changes — documentation and UAT alignment only

## Capabilities

### New Capabilities

- `center-public-profile`: Franchise staff edit center display profile; changes appear on center public marketing host

### Modified Capabilities

- (none)

## Impact

- `apps/web/src/features/center/settings/` — settings form and photo upload
- `apps/web/src/lib/centerProfileApi.ts` — RPC client
- `supabase/migrations/046_center_public_profile.sql` — `update_center_public_profile_rpc`, `get_center_landing_public`
- `docs/ops/runbook.md` — already documents migration; spec becomes canonical behavior reference
