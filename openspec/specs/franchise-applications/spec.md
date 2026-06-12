# franchise-applications Specification

## Purpose

Prospective franchise owners apply to open a center under a brand via the brand public site. Brand staff review applications, approve inquiries, and provision center hosts with operator access in a single transaction.

## Related

- Journey: [`docs/journeys/franchise-owner.md`](../../../docs/journeys/franchise-owner.md)
- Data flow: [`docs/spec/data-flow.md`](../../../docs/spec/data-flow.md) Flow 2
- Portal matrix: [`docs/spec/portal-host-matrix.md`](../../../docs/spec/portal-host-matrix.md)

## Requirements

### Requirement: Public franchise application form

The brand host SHALL expose a franchise application form (`#apply`) with extended fields: applicant name, email, phone, proposed franchise name, address, city, state, pincode, and experience.

Traceability: FR-B01, FR-B03

#### Scenario: Applicant submits on brand site

- **WHEN** a visitor submits the franchise application on the brand public homepage
- **THEN** the system persists the inquiry via `submit_franchise_inquiry_v2` into `franchise_inquiries`
- **AND** the form is available when the brand is active with domain mapped, without gating on paid subscription

#### Scenario: Applicant does not use wrong portal

- **WHEN** a franchise applicant attempts to apply
- **THEN** they use the brand host only — not the platform brand-signup form or center registration form

### Requirement: Franchise applications workspace

Brand staff SHALL manage franchise inquiries at `/app/franchise-applications`, separate from Settings.

Traceability: FR-B20

#### Scenario: Brand reviews pending application

- **WHEN** brand staff open Franchise Applications
- **THEN** pending inquiries from public and manual entry are listed for review

### Requirement: Approve franchise inquiry

Brand staff SHALL approve inquiries to provision a franchise center, domain, and operator invite atomically.

Traceability: FR-B21

#### Scenario: Approve inquiry provisions center

- **WHEN** brand staff approve a franchise inquiry
- **THEN** the system creates a `franchise_centers` row with slug from the proposed name
- **AND** creates `domain_mappings` for `{center_slug}.{brand_slug}` host
- **AND** creates center operator membership and auth invite
- **AND** the center host loads with student registration only (no franchise form)
- **AND** the franchise operator can log in at center `/app` immediately after approval

#### Scenario: Franchise does not pay EduNudg

- **WHEN** a franchise center is provisioned
- **THEN** no EduNudg subscription is required for the center operator

### Requirement: Manual franchise inquiry entry

Brand staff SHALL create franchise inquiries manually from `/app/franchise-applications`.

#### Scenario: Staff manual franchise inquiry

- **WHEN** brand staff create an inquiry via `create_franchise_inquiry_staff`
- **THEN** the inquiry appears in the franchise applications list for review and approval
