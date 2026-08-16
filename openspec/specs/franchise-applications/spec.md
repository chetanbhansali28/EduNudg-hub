# franchise-applications Specification

## Purpose

Prospective franchise owners apply to open a center under a brand via the brand public site. Brand staff review applications, approve inquiries, and provision center hosts with operator access in a single transaction.

## Related

- Journey: [`docs/journeys/franchise-owner.md`](../../../docs/journeys/franchise-owner.md)
- Data flow: [`docs/spec/data-flow.md`](../../../docs/spec/data-flow.md) Flow 2
- Portal matrix: [`docs/spec/portal-host-matrix.md`](../../../docs/spec/portal-host-matrix.md)

## Requirements

### Requirement: Public franchise application form

The brand host SHALL expose a franchise application (`#apply`) with extended fields: applicant name, email, phone, proposed franchise name, address, city, state, pincode, and experience.

On **Abacus Classic** and **Spark Academy** themes, the application SHALL open in a dialog modal (`MarketingLeadModals`). URL hash `#apply` and CTA href `apply` SHALL open the apply modal via `resolveLeadModalKind` / `LeadModalHashOpener`. On Spark Academy the dialog SHALL use Spark chrome (`ac-modal--spark`). Center hosts SHALL NOT expose the franchise apply modal. The apply modal SHALL use the same viewport-capped responsive layout as enroll (mobile full-width; desktop centered two-column fields; scrollable body).

Traceability: FR-B01, FR-B03

#### Scenario: Applicant submits on brand site

- **WHEN** a visitor submits the franchise application on the brand public homepage
- **THEN** the system persists the inquiry via `submit_franchise_inquiry_v2` into `franchise_inquiries`
- **AND** the form is available when the brand is active with domain mapped, without gating on paid subscription

#### Scenario: Deep link opens apply modal (Abacus/Spark)

- **WHEN** a visitor opens the brand public site with hash `#apply`
- **THEN** `LeadModalHashOpener` opens the franchise apply modal
- **AND** submitting calls `submit_franchise_inquiry` / `submit_franchise_inquiry_v2`

#### Scenario: Applicant does not use wrong portal

- **WHEN** a franchise applicant attempts to apply
- **THEN** they use the brand host only — not the platform brand-signup form or center registration form

### Requirement: Franchise applications workspace

Brand staff SHALL manage franchise inquiries at `/app/franchise-applications`, separate from Settings.

Traceability: FR-B20

#### Scenario: Brand reviews pending application

- **WHEN** brand staff open Franchise Applications
- **THEN** filter tabs are **Pending review** and **Decided** only
- **AND** a stats strip shows Pending review, Approved, Rejected, and Total (same `LeadKpiGrid` chrome as Student Leads)
- **AND** pending inquiries from public and manual entry are listed under **Pending review**

#### Scenario: Search finds applications from any tab

- **WHEN** brand staff type in Search applications while Pending review or Decided is selected
- **THEN** matching inquiries are shown immediately (name, applicant, city, email, phone)
- **AND** the current tab stays selected (there is no **All applications** tab)
- **AND** clearing the search restores the tab’s unfiltered list

#### Scenario: Soft-deleted franchise stays in applications history

- **WHEN** brand staff delete a franchise from Franchise Management (`soft_delete_franchise_center`)
- **THEN** the matching approved inquiry is **not** removed
- **AND** the inquiry stays on **Decided** with a DELETED badge (there is no separate **Deleted** tab)
- **AND** on **Decided**, deleted inquiries sort after live approved/rejected rows
- **AND** the detail view explains the franchise was deleted from Franchise Management and is kept for history

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

- **WHEN** brand staff choose **Add Franchise**
- **THEN** a modal dialog opens with the same fields as the public apply form
- **AND** submitting via `create_franchise_inquiry_staff` adds the inquiry to the franchise applications list for review and approval

#### Scenario: Franchise applications stay usable on small screens

- **WHEN** brand staff use Franchise Applications on a phone or tablet
- **THEN** filter tabs, application names, the add-franchise dialog, and approve/reject actions remain fully visible without clipping
- **AND** the add-franchise dialog scrolls inside the modal so header and footer stay on screen
