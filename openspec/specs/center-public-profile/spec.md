# center-public-profile Specification

## Purpose

Franchise staff maintain how their center appears on the public marketing host: contact details, photo, description, and social links. Changes in center Settings flow to the public landing page via `get_center_landing_public`.

## Related

- Migration: [`supabase/migrations/046_center_public_profile.sql`](../../../supabase/migrations/046_center_public_profile.sql)
- Runbook: [`docs/ops/runbook.md`](../../../docs/ops/runbook.md) — Center public profile section
- Portal matrix: [`docs/spec/portal-host-matrix.md`](../../../docs/spec/portal-host-matrix.md)

## Requirements
### Requirement: Center public profile settings

Franchise staff SHALL edit center public profile fields at `/app/settings`: display name, short description, address line, city, region, pincode, country, contact phone, photo, and up to six social links.

#### Scenario: Staff saves profile

- **WHEN** center staff submit the public profile form with valid data
- **THEN** the system calls `update_center_public_profile_rpc` for their center
- **AND** persisted fields update on `franchise_centers`

#### Scenario: Sign-in email is read-only

- **WHEN** center staff view Settings account section
- **THEN** sign-in email from auth is displayed
- **AND** it is not editable in the profile form

#### Scenario: Public site URL shown

- **WHEN** center staff view Settings
- **THEN** the center marketing URL (`{center}.{brand}` host) is displayed for reference

### Requirement: Center photo upload

Franchise staff SHALL upload a center photo stored in the `brand-assets` bucket at `{brand_id}/centers/{center_id}/photo.{ext}`.

#### Scenario: Photo appears after upload

- **WHEN** center staff upload a valid image (PNG, JPEG, WebP, or GIF within size limit)
- **THEN** `photo_url` is saved on the center record
- **AND** the photo appears on the center public landing page

### Requirement: Social links validation

The system SHALL accept `social_links` as a JSON array of `{platform, url}` with at most six entries.

#### Scenario: Reject invalid social links

- **WHEN** staff save a profile with more than six social links or non-array `social_links`
- **THEN** the RPC rejects the update with an error message

### Requirement: Public landing reflects profile

The center public homepage SHALL display profile fields from `get_center_landing_public` including display name, description, address, contact phone, photo, and social links.

#### Scenario: Public page after settings save

- **WHEN** a visitor opens the center public homepage after staff save profile changes
- **THEN** updated display name, blurb, contact, photo, and social links are visible
- **AND** the nav shows the brand logo only (no center logo)

#### Scenario: Authorized editors

- **WHEN** a user without center, brand, or platform access attempts to update another center's profile
- **THEN** `update_center_public_profile_rpc` rejects the request

