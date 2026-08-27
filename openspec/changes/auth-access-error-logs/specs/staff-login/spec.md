# staff-login (delta)

## ADDED Requirements

### Requirement: Login failures and denials emit auth audit events

Staff `/login` SHALL report `login_failure` when email/password (or OTP) auth returns an error, and `access_denied` when a session exists but the user has no portal membership. Reporting SHALL be best-effort and MUST NOT replace the existing user-visible error copy.

#### Scenario: Wrong password still shows the existing error

- **GIVEN** a staff login form on any portal
- **WHEN** `signInWithEmail` returns an error
- **THEN** the page shows the existing sign-in failed message
- **AND** the client attempts to record `login_failure` without including the password
