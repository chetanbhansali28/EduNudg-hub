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

### Requirement: Automated tests use library-correct exact name matchers

Exact accessible-name matching SHALL use the API supported by each test library:

| Library | Exact match for primary `Log in` |
|---------|----------------------------------|
| **Playwright** (`e2e/`) | `{ name: "Log in", exact: true }` |
| **Testing Library** (Vitest) | `{ name: exactAccessibleName("Log in") }` which is `/^Log in$/` — **not** `{ exact: true }` (invalid on `ByRoleOptions`; fails `tsc`) |

OAuth queries SHALL use the full provider label with the same library-specific exact matcher. A regression E2E SHALL assert that Playwright non-exact `Log in` matches more than one button when OAuth is shown. A Vitest regression SHALL fail if Testing Library role queries pass `exact: true`.

#### Scenario: Testing Library rejects Playwright exact option

- **GIVEN** a Vitest + Testing Library component test
- **WHEN** `getByRole` is called with `{ name: "…", exact: true }`
- **THEN** TypeScript SHALL report that `exact` does not exist on `ByRoleOptions`
- **AND** authors SHALL switch to `exactAccessibleName("…")` from `@/test/exactAccessibleName`
