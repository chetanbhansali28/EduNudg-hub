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

Footer social icons on the **center** host SHALL use `franchise_centers.social_links` (Facebook, Instagram, YouTube, WhatsApp, LinkedIn, X when a valid `https` URL is saved), not brand `social_connect`. Brand landing Social Media Connect remains Facebook/Instagram only and SHALL NOT show a WhatsApp float.

On a **center** host, Novu, Abacus Classic, and Spark Academy footers SHALL show the same franchise Location & Contact overlay (`centerFooterContactFromProfile`) — street, city · region · pincode, and phone — and SHALL NOT show brand `headOffice`, brand “Our presence”, or Spark’s placeholder phone. Brand hosts keep Head office / presence unchanged.

#### Scenario: Footer social uses franchise URLs

- **GIVEN** the brand Social Media Connect points at the brand owner's Facebook/Instagram
- **AND** the franchise saved its own social URLs in Franchise Management / center Settings
- **WHEN** a visitor opens the center public site (View Frontend)
- **THEN** the footer shows icons for each saved https link (including YouTube)
- **AND** does not open the brand owner's social pages

#### Scenario: Public page after settings save

- **WHEN** a visitor opens the center public homepage after staff save profile changes
- **THEN** updated display name, blurb, contact, photo, and social links are visible
- **AND** the nav shows the brand logo only (no center logo)

#### Scenario: Franchise frontend nav highlights logo and name

- **WHEN** a visitor opens a center (franchise) public site
- **THEN** the sticky nav uses a franchise lockup (`ac-nav--franchise` / `sa-nav--franchise` / `novu-nav-bar--franchise`)
- **AND** the brand logo and site name are larger and bolder than on the brand homepage nav

#### Scenario: Footer contact uses franchise address on every theme

- **GIVEN** Franchise Management saved this center’s address and phone
- **AND** the brand homepage Head office still lists the brand owner HQ
- **WHEN** a visitor opens View Frontend (Novu, Abacus Classic, or Spark Academy)
- **THEN** the footer shows **This center** / **Contact Us** with the franchise address and phone
- **AND** does not show brand Head office, brand presence cities, or a placeholder phone

#### Scenario: Footer blurb uses franchise name not Sample Center

- **GIVEN** the brand center-landing template still contains the editor placeholder **Sample Center**
- **AND** Franchise Identity name / display name is saved (e.g. Smart Brain Abacus)
- **WHEN** a visitor opens that center’s public site
- **THEN** the footer description and site name use the franchise display name
- **AND** do not show **Sample Center**
- **AND** copyright omits “Part of {brand}” when the franchise name matches the brand name

### Requirement: Franchise public programs match center enablement

The center public homepage SHALL list only programs assigned to that franchise in `center_program_enablement` (via `center_public_curriculum_json`). Center sites marketing cards SHALL be restricted to matching enabled program names.

#### Scenario: WHAT WE TEACH shows only subscribed courses

- **GIVEN** the brand Center sites template lists Abacus, Vedic Mathematics, and Handwriting
- **AND** Franchise Management enabled only Abacus for this center
- **WHEN** a visitor opens that franchise public site
- **THEN** WHAT WE TEACH / courses / syllabus show Abacus only
- **AND** Vedic Mathematics and Handwriting cards are omitted

### Requirement: No franchise apply on center public landing

Center (franchise) public landing pages SHALL NOT show brand franchise-application CTAs. **Apply franchise** (and `#apply` / `apply` secondary CTAs) are brand-homepage only.

#### Scenario: Center Abacus Classic nav omits Apply franchise

- **WHEN** a visitor opens a center public site on Abacus Classic (or Spark) theme
- **THEN** the sticky nav and hero MUST NOT show an **Apply franchise** button
- **AND** `sanitizeCenterPublicNavConfig` strips secondary franchise CTAs and `#apply` nav links before render

#### Scenario: Authorized editors

- **WHEN** a user without center, brand, or platform access attempts to update another center's profile
- **THEN** `update_center_public_profile_rpc` rejects the request

