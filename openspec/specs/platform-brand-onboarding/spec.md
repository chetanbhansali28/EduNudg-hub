# platform-brand-onboarding Specification

## Purpose

How a new brand customer (e.g. Abacus World) joins EduNudg as a B2B subscriber — distinct from franchise applicants joining an existing brand. Covers public signup, platform approval, brand host provisioning, and owner access.

## Related

- Journey: [`docs/journeys/platform-brand-onboarding.md`](../../../docs/journeys/platform-brand-onboarding.md)
- Data flow: [`docs/spec/data-flow.md`](../../../docs/spec/data-flow.md) Flow 1
- Portal matrix: [`docs/spec/portal-host-matrix.md`](../../../docs/spec/portal-host-matrix.md)

## Requirements

### Requirement: Public brand signup form

The platform host SHALL expose a brand signup form on `/` with fields: organization name, admin name, email, phone, city (required), country, and message.

Traceability: FR-P01

#### Scenario: Visitor submits brand signup

- **WHEN** a visitor submits the platform homepage brand signup form with all required fields
- **THEN** the system persists a pending signup via `submit_platform_brand_signup`
- **AND** no franchise or student application forms appear on the platform host

Traceability: FR-P06

#### Scenario: Duplicate admin email

- **WHEN** a second signup is submitted with the same admin email while one is already pending
- **THEN** the system does not create a duplicate pending row

Traceability: FR-P02

### Requirement: Platform admin approval

Platform admins SHALL review pending signups at `/admin/brands` and approve them to provision a live brand.

Traceability: FR-P03, FR-P04

#### Scenario: Approve pending signup

- **WHEN** a platform admin approves a pending brand signup
- **THEN** the system creates a `brands` row with slug `slugify(name)-slugify(city)`
- **AND** creates `domain_mappings` for `{slug}.localhost:9000` (or production equivalent)
- **AND** creates a draft `brand_subscriptions` row
- **AND** creates a `brand_owner` membership and auth invite for the signup email
- **AND** the brand owner can log in at `{slug-host}/login` and reach `/app`

#### Scenario: Slug collision on approve

- **WHEN** the generated slug already exists for another brand
- **THEN** the system appends `-2`, `-3`, or higher numeric suffix after the city-suffixed base

Traceability: FR-P05

### Requirement: Manual platform brand signup

Platform admins SHALL be able to create pending brand signups manually from `/admin/brands` without a public form submission.

#### Scenario: Staff manual signup

- **WHEN** a platform admin creates a signup via `create_platform_brand_signup_staff`
- **THEN** a pending `platform_brand_signups` row appears in the approval queue
- **AND** the same approve flow provisions the brand
