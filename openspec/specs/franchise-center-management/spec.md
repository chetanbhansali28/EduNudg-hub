# Franchise center management

Brand staff SHALL manage all franchise centers from a master-detail workspace at `/app/centers`.

## Related

- Journey: [`docs/journeys/brand-operator.md`](../../../docs/journeys/brand-operator.md)
- CSV bulk import: [`openspec/specs/franchise-center-csv-import/spec.md`](../franchise-center-csv-import/spec.md)
- Change source: `openspec/changes/franchise-center-management/` (shipped; mainline copy)

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

### Requirement: Center owner login credentials

Brand staff SHALL view and set the franchise center login email and password from Franchise Identity on `/app/centers`. Credentials SHALL provision Supabase Auth and an active `center_owner` membership so the same email/password work on the center host `/login`. Login email SHALL NOT be stored on `franchise_centers`; source of truth is Auth + `profiles` + memberships. Profile-only saves SHALL NOT call `center-owner-credentials`. Franchise Identity helper text SHALL show an environment-aware login URL via `portalLoginUrl` (local `{center}.{brand}.localhost:9000/login`; Vercel same-origin `/login?portal=center&brand=…&center=…`) — never a hardcoded localhost host when the brand app is on `*.vercel.app`.

#### Scenario: Show login email from database

- **WHEN** brand staff open a franchise detail panel
- **THEN** Franchise Identity shows the active `center_owner` login email from `get_center_owner_login`
- **AND** helper text links to the center staff login URL for the current environment

#### Scenario: Create or reset franchise password

- **WHEN** brand staff enter a login email and password (password required when no prior login exists) and save
- **THEN** the SPA invokes `center-owner-credentials` to create or update the Auth user and sync `center_owner` membership
- **AND** that email and password can sign in at the center portal login URL (`portalLoginUrl`)
- **AND** passwords shorter than 6 characters (including `admin`) are rejected with a clear message — Auth does not allow them
- **AND** that error scrolls into view so staff do not have to hunt for it above Save Changes

#### Scenario: Profile-only save skips credentials

- **WHEN** brand staff save name, photo, or description without intentionally editing login fields
- **THEN** the SPA does not invoke `upsertCenterOwnerCredentials` / `center-owner-credentials`

### Requirement: Bulk CSV import

Brand staff with `centers.create` SHALL bulk-onboard franchise centers from CSV on `/app/centers`, using the same flow as platform admins (`import_franchise_centers`).

#### Scenario: Import Franchise on franchise management

- **GIVEN** brand owner or brand admin is on `/app/centers`
- **WHEN** they click **Import Franchise**
- **THEN** the franchise center CSV import dialog opens
- **AND** created centers appear in the directory after a successful import

See [`openspec/specs/franchise-center-csv-import/spec.md`](../franchise-center-csv-import/spec.md).

### Requirement: View franchise frontend and backend

Brand staff SHALL open the selected franchise public site and staff app from `/app/centers`.

#### Scenario: View frontend and backend

- **GIVEN** brand staff have a franchise selected
- **WHEN** they click **View Frontend** or **View Backend**
- **THEN** the browser opens the center marketing URL or center `/app` in a new tab

### Requirement: Disable and enable franchise

Brand staff SHALL disable and enable franchises reversibly (`set_franchise_center_status` `suspended` ↔ `active`).

#### Scenario: Disable blocks center staff

- **WHEN** brand staff disable a franchise
- **THEN** `franchise_centers.status` becomes `suspended`
- **AND** center staff cannot access center `/app` or run center mutation RPCs
- **AND** brand staff may still manage the franchise from the brand portal

#### Scenario: Enable restores access

- **WHEN** brand staff enable a disabled franchise
- **THEN** `franchise_centers.status` becomes `active`
- **AND** center staff access is restored

### Requirement: Soft-delete franchise

Brand staff with `centers.delete` SHALL remove a franchise from Brand Backend via `soft_delete_franchise_center`.

#### Scenario: Confirm delete

- **WHEN** brand staff confirm **Delete franchise**
- **THEN** `franchise_centers.deleted_at` is set and status becomes `closed`
- **AND** the center disappears from `/app/centers` and public landing
- **AND** student and lead rows are not hard-deleted

### Requirement: Version-level curriculum assignment

Brand staff SHALL assign and unassign published curriculum versions per franchise.

#### Scenario: Sync curriculum versions

- **WHEN** brand staff save curriculum assignment for a center
- **THEN** `center_curriculum_enablement` reflects the selected published versions
- **AND** center batches may only use authorized versions

#### Scenario: Block removal of version in use

- **WHEN** brand staff remove a version that has active batches at the center
- **THEN** the sync is rejected with `CURRICULUM_VERSION_IN_USE`

#### Scenario: Franchise public site lists assigned programs only

- **WHEN** a visitor opens that franchise’s public marketing site
- **THEN** program cards come from `center_program_enablement` for that center
- **AND** Center sites accordion cards for unassigned courses are not shown

### Requirement: Student impact deferred

Student learn portal behavior when a franchise is suspended is out of scope for this change.

#### Scenario: Documented TODO

- **WHEN** this capability ships
- **THEN** student portal suspend behavior remains unchanged until a follow-up change
