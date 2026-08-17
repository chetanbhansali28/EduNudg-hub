# Staff Login

Platform, brand, and center staff sign in at `/login` with email/password and optional OAuth providers.

## Requirements

### Requirement: Login form exposes a unique primary submit control

The staff login form SHALL render a primary email/password submit button whose accessible name is exactly `Log in` (or `Signing in…` while the request is in flight). OAuth actions SHALL use distinct accessible names that include the provider (`Log in with Google`, `Log in with Facebook`, `Log in with WhatsApp`). When passkeys are enabled, a secondary **Log in with passkey** control SHALL appear below social providers. Users MUST register a passkey while signed in (Settings → Passkeys) before passkey login succeeds.

#### Scenario: Passkey login requires prior registration

- **GIVEN** passkeys are enabled and the user has no `passkey_credentials` row
- **WHEN** they choose **Log in with passkey**
- **THEN** the app SHALL show a clear error (no passkey found / not registered)
- **AND** SHALL NOT create a session

#### Scenario: Passkey registration while signed in

- **GIVEN** a signed-in staff user on platform, brand, or center settings
- **WHEN** they add a passkey from Settings
- **THEN** the SPA SHALL call `passkey-verify` with `register-options` and `register-verify`
- **AND** store the credential in `passkey_credentials`

#### Scenario: Primary submit is distinguishable from OAuth

- **GIVEN** a visitor opens `/login` on the platform portal with Google (and any other) OAuth enabled
- **WHEN** assistive tech or tests query `role=button` with accessible name `Log in`
- **THEN** using an **exact** name match resolves to the primary email submit control only
- **AND** substring matching without exactness also matches OAuth buttons whose names start with `Log in with …`

#### Scenario: OAuth returns to login for membership gate

- **GIVEN** a staff portal with Google auth enabled
- **WHEN** the user completes Google OAuth
- **THEN** Supabase SHALL redirect to `{origin}/login` (preserving safe `?next=` when present)
- **AND** if the user lacks portal membership the app SHALL sign them out automatically and show: `{email} is not authorized for this website. Contact your administrator to request access.`
- **AND** post-login `?next=` values MUST be same-origin relative paths (`/admin`, `/app`) — protocol-relative (`//…`) and absolute URLs are rejected

#### Scenario: Split-screen platform login smoke

- **GIVEN** the platform marketing login page
- **WHEN** the page loads
- **THEN** heading `Welcome back!`, platform account copy, Email field, and exact `Log in` submit are visible
- **AND** `Log in with Google` is available when Google auth is enabled
- **AND** the page SHALL render the same enterprise Site nav and site footer as platform `/`

### Requirement: Platform login uses public marketing chrome

Platform host `/login` SHALL render as a child of `MarketingPublicLayout` with the homepage Site header (`EnterpriseNav`) and site footer (`EnterpriseSiteFooter`). The login split SHALL NOT use a full-viewport `ThemeProvider` shell that hides that chrome.

#### Scenario: Platform login keeps homepage nav and footer

- **GIVEN** a visitor opens `/login` on the platform host
- **WHEN** the login form is ready
- **THEN** navigation labelled `Site` is visible
- **AND** the enterprise site footer is visible
- **AND** the layout root has class `marketing-page--login`

### Requirement: Brand login uses that brand’s public marketing chrome

Brand host `/login` SHALL render as a child of `BrandPublicLayout` with the same nav and footer as brand `/` for the assigned `marketing_theme` (Abacus Classic, Spark Academy, or Novu). The login split SHALL NOT use a full-viewport `ThemeProvider` shell that hides that chrome.

#### Scenario: Brand login keeps homepage nav and footer

- **GIVEN** a visitor opens `/login` on a brand host (for example `smart-brain-abacus.localhost`)
- **WHEN** the login form is ready
- **THEN** the brand public header (Abacus `header.ac-nav`, Spark `header.sa-nav`, or Novu Site nav) is visible
- **AND** the matching site footer is visible
- **AND** the layout root has class `marketing-page--login`

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
