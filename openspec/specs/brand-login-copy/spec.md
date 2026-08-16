# Brand Login Copy

Brand `/app/settings` **White-label & Login Copy** customizes the greeting on tenant login screens.

## Requirements

### Requirement: Login copy preview matches saved branding

The card SHALL explain that one headline and subtext apply to brand, center, student, and parent `/login`. Empty fields SHALL fall back to per-portal defaults. A live preview SHALL mimic the desktop staff login split (dark hero + form stub), keep the hero visible at all preview widths, and update the brand-staff greeting as the operator types without saving. Query refetch SHALL NOT reset in-progress draft fields unless `brand_settings.id` or `updated_at` changed. Saving SHALL persist `login_headline` / `login_subtext` on `brand_settings.settings`, clear the in-memory portal branding cache, and invalidate `portal-branding` queries so `/login` shows the new copy. Site logo SHALL remain Homepage `landing.meta`, not this card.

#### Scenario: Draft headline appears in preview

- **GIVEN** a brand named Smart Brain Abacus
- **WHEN** the operator types a login headline
- **THEN** the preview hero SHALL show that headline immediately
- **AND** the form stub SHALL still show Welcome back!
- **AND** blank fields SHALL preview the default brand-staff greeting

#### Scenario: Save drops stale login cache

- **GIVEN** `get_portal_branding` results were cached in the SPA
- **WHEN** the operator saves login copy
- **THEN** the cache SHALL be cleared
- **AND** the next `/login` load SHALL fetch the saved JSON
