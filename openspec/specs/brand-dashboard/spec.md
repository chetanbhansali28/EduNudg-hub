# brand-dashboard Specification

## Purpose

Brand staff see an operational home at `/app` (**Today at a glance**), including a Center Health setup score.

## Related

- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Curriculum: [`brand-curriculum-workspace`](../brand-curriculum-workspace/spec.md)
- Success stories: [`brand-success-stories`](../brand-success-stories/spec.md)
- Students: [`brand-students-workspace`](../brand-students-workspace/spec.md)
- Franchises: [`franchise-center-management`](../franchise-center-management/spec.md)
- Homepage / franchise site: [`docs/frontend/marketing-landing.md`](../../../docs/frontend/marketing-landing.md)

## Requirements

### Requirement: Center Health is a six-check setup score

Brand `/app` Center Health SHALL be 100% only when all six equal-weight checks pass. Percent SHALL be `round(metCount / 6 * 100)`. Empty seed landing JSON SHALL NOT count as set.

| Check | Minimum | Source |
|---|---|---|
| Curriculum | 1 course | `programs` for the brand (`deleted_at` is null) |
| Feedback | 2 stories | `brand_success_stories` for the brand |
| Students | 2 students | `students` for the brand (`deleted_at` is null) |
| Franchises | 2 centers | `franchise_centers` for the brand (`deleted_at` is null) |
| Homepage | content set | `brand_settings.settings.landing` via `/app/homepage` |
| Franchise site | content set | `brand_settings.settings.center_landing` via `/app/center-site` |

#### Scenario: Incomplete setup lists the gaps

- **GIVEN** a brand with 1 curriculum, 1 feedback, 2 students, 1 franchise, homepage content set, and franchise site content unset
- **WHEN** they open `/app`
- **THEN** Center Health is 50%
- **AND** the card lists the missing checks (add 1 more feedback, add 1 more franchise, set franchise site content)
- **AND** the copy does not say centers are operating at target margin

#### Scenario: Homepage and franchise site content are required

- **GIVEN** a brand that meets curriculum, feedback, student, and franchise minima
- **AND** stored `landing` and `center_landing` are empty or seed-only
- **WHEN** they open `/app`
- **THEN** Center Health is 67%
- **AND** the card links **Set homepage content** to `/app/homepage`
- **AND** the card links **Set franchise site content** to `/app/center-site`

#### Scenario: All minima met

- **GIVEN** a brand with at least 1 curriculum, 2 feedbacks, 2 students, 2 franchises, configured homepage content, and configured franchise site content
- **WHEN** they open `/app`
- **THEN** Center Health is 100%
- **AND** the card states all checks passed

### Requirement: Incomplete setup reminds on login

When Center Health is below 100%, brand `/app` SHALL open a setup reminder dialog after login. The dialog SHALL list the same missing checks as the dashboard card, sit in the center of the viewport (`inset: 0; margin: auto`), use brand theme tokens (`--ed-card`, `--ed-primary`, `--ed-border`), and stay usable on narrow screens. When setup is 100%, the dialog SHALL NOT open. After the user dismisses it, it SHALL NOT open again until the next login (seen flag is session-scoped and cleared on sign-out).

#### Scenario: Login popup when setup is incomplete

- **GIVEN** a brand user whose Center Health is 50%
- **WHEN** they land on `/app` after login
- **THEN** a dialog titled **Finish Center Health setup** opens
- **AND** it lists the remaining checks

#### Scenario: No popup when setup is complete

- **GIVEN** a brand user whose Center Health is 100%
- **WHEN** they land on `/app` after login
- **THEN** the Center Health reminder dialog does not open
