# Staff Login

Platform, brand, and center staff sign in at `/login` with email/password and optional OAuth providers.

## Requirements

### Requirement: Login form exposes a unique primary submit control

The staff login form SHALL render a primary email/password submit button whose accessible name is exactly `Log in` (or `Signing in…` while the request is in flight). OAuth actions SHALL use distinct accessible names that include the provider (`Log in with Google`, `Log in with Facebook`, `Log in with WhatsApp`).

#### Scenario: Primary submit is distinguishable from OAuth

- **GIVEN** a visitor opens `/login` on the platform portal with Google (and any other) OAuth enabled
- **WHEN** assistive tech or tests query `role=button` with accessible name `Log in`
- **THEN** using an **exact** name match resolves to the primary email submit control only
- **AND** substring matching without exactness also matches OAuth buttons whose names start with `Log in with …`

#### Scenario: Split-screen platform login smoke

- **GIVEN** the platform marketing login page
- **WHEN** the page loads
- **THEN** heading `Welcome back!`, platform account copy, Email field, and exact `Log in` submit are visible
- **AND** `Log in with Google` is available when Google auth is enabled

### Requirement: Automated tests use exact accessible names for Log in

Playwright and Testing Library queries for the primary submit SHALL pass `{ name: "Log in", exact: true }` (or an equivalent exact matcher). Queries for OAuth SHALL use the full provider label. A regression E2E SHALL assert that non-exact `Log in` matches more than one button when OAuth is shown.
