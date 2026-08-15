## MODIFIED Requirements

### Requirement: Learn portal navigation

The learn portal SHALL expose navigation items: Dashboard (`/`), Progress (`/progress`), Activity (`/activity`), and Profile (`/profile`). Competitions (`/competitions`, labeled Events) SHALL appear only when `brand_settings.settings.features.competitions` is true.

Traceability: FR-S14, FR-S22

#### Scenario: Authenticated student sees expanded nav when Competitions is on

- **WHEN** student opens the learn portal shell and `features.competitions` is true
- **THEN** sidebar lists Dashboard, Progress, Events, Activity, and Profile
- **AND** kits/merchandise routes are not present (FR-S03)

#### Scenario: Events hidden when Competitions is off

- **WHEN** student opens the learn portal shell and `features.competitions` is false
- **THEN** Events is omitted from sidebar and bottom nav
- **AND** `/competitions` redirects to `/`

## ADDED Requirements

### Requirement: Student competition quiz

When a competition has attached questions, enrolled students SHALL take a one-attempt quiz on `/competitions`. The server SHALL score answers and write `student_competition_entries.score`. Quiz payloads SHALL omit correct answers until after submit.

Traceability: FR-S22

#### Scenario: Take quiz from My registrations

- **GIVEN** student S is registered for competition K with questions and the quiz window is open
- **WHEN** S opens `/competitions` My registrations
- **THEN** Take quiz is available
- **AND** submitting stores the attempt score for Past results
