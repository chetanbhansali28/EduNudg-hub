## Context

Migration `046_center_public_profile.sql` added `photo_url` and `social_links` to `franchise_centers`, an RPC for staff updates, and extended `get_center_landing_public` for the center marketing page. Implementation exists in center Settings and public landing components.

## Goals / Non-Goals

**Goals:**

- Capture UAT-testable requirements for center public profile
- Align spec with existing RPC field limits (max 6 social links, JSON array shape)
- Document storage path for center photos in `brand-assets` bucket

**Non-Goals:**

- New profile fields beyond migration 046
- Parent or student self-serve profile editing
- Center logo in public nav (brand logo only per portal-host-matrix)

## Decisions

1. **RPC-only writes** — Staff updates go through `update_center_public_profile_rpc`; browser uses authenticated client wrapper, not direct table UPDATE. Rationale: tenant checks in SECURITY DEFINER function.

2. **Photo in brand-assets** — Path `{brand_id}/centers/{center_id}/photo.{ext}` matches brand logo and merchandise patterns. Rationale: single public bucket with RLS.

3. **Login email read-only** — Settings shows auth email for reference; not editable in profile form. Rationale: identity comes from Google/social auth provider.

## Risks / Trade-offs

- [Public cache stale after save] → `CenterPublicProfileForm` invalidates `center-landing` query on success
- [Invalid social_links payload] → RPC rejects non-array or arrays longer than 6 entries

## Migration Plan

Spec-only change. No deploy steps beyond ensuring `046_center_public_profile.sql` is applied (`supabase db push`).

## Open Questions

- None for v1 UAT scope
