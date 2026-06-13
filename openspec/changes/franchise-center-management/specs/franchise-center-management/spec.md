# Franchise center management

Brand staff SHALL manage all franchise centers from a master-detail workspace at `/app/centers`.

## Requirements

### Requirement: Master-detail franchise workspace

Brand staff SHALL view franchise centers in a two-column layout: searchable list and detail panel.

#### Scenario: Select center shows detail

- **WHEN** brand staff click a franchise in the list
- **THEN** the detail panel shows profile, KPIs, curriculum assignment, and lifecycle actions
- **AND** the list remains visible in the first column

#### Scenario: Search by name or phone

- **WHEN** brand staff enter text in the search field
- **THEN** the list filters by center name, display name, or contact phone

### Requirement: Edit franchise profile

Brand staff SHALL edit franchise details except slug.

#### Scenario: Save profile updates

- **WHEN** brand staff save profile changes
- **THEN** `franchise_centers` fields update via authorized RPCs
- **AND** slug is not modified

### Requirement: No franchise delete

Brand staff SHALL NOT delete franchise centers from the UI.

#### Scenario: Delete action absent

- **WHEN** brand staff view franchise management
- **THEN** no delete or soft-delete control is shown

### Requirement: Suspend and re-enable franchise

Brand staff SHALL suspend and re-enable franchises reversibly.

#### Scenario: Suspend blocks center staff

- **WHEN** brand staff suspend a franchise
- **THEN** `franchise_centers.status` becomes `suspended`
- **AND** center staff cannot access center `/app` or run center mutation RPCs
- **AND** brand staff may still manage the franchise from the brand portal

#### Scenario: Re-enable restores access

- **WHEN** brand staff re-enable a suspended franchise
- **THEN** `franchise_centers.status` becomes `active`
- **AND** center staff access is restored

### Requirement: Version-level curriculum assignment

Brand staff SHALL assign and unassign published curriculum versions per franchise.

#### Scenario: Sync curriculum versions

- **WHEN** brand staff save curriculum assignment for a center
- **THEN** `center_curriculum_enablement` reflects the selected published versions
- **AND** center batches may only use authorized versions

#### Scenario: Block removal of version in use

- **WHEN** brand staff remove a version that has active batches at the center
- **THEN** the sync is rejected with `CURRICULUM_VERSION_IN_USE`

### Requirement: Student impact deferred

Student learn portal behavior when a franchise is suspended is out of scope for this change.

#### Scenario: Documented TODO

- **WHEN** this capability ships
- **THEN** student portal suspend behavior remains unchanged until a follow-up change
