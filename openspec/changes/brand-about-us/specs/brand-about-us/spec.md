## ADDED Requirements

### Requirement: Brand About Us editor

Brand admins SHALL edit About Us content from Homepage Configuration (all brand marketing themes).

#### Scenario: Save about payload

- **GIVEN** a brand admin opens Homepage Configuration
- **WHEN** they fill company story, philosophy, features, team members (with optional photos), and save
- **THEN** the config is stored in `brand_settings.settings.landing.about`
- **AND** team/feature photos use `brand-assets` via the existing marketing media uploader
- **AND** saves run `preserveCustomMarketingMediaUrls` so stock URLs cannot wipe uploads

### Requirement: Dedicated public About page

Brands SHALL expose a public `/about` page when published.

#### Scenario: Published about page

- **GIVEN** `about.publishPage` is true (default) and About has renderable content
- **WHEN** a visitor opens `/{brand host}/about`
- **THEN** Novu and Abacus Classic show Mastermind-style sections in order: hero, about/story (+ optional image), philosophy, what makes us different (features), what we do, team grid (photo → name → role), optional dual CTA band
- **AND** Spark Academy `/about` reuses homepage blocks (Hero, Features, Journey, Mentors) filled from `landing.about` instead of that dedicated chrome
- **AND** the page uses the brand marketing theme chrome (nav/footer)

#### Scenario: Spark Academy about uses homepage blocks

- **GIVEN** a Spark Academy brand with published About content
- **WHEN** a visitor opens `/about`
- **THEN** the page renders `SparkAcademyHero`, `FeaturesSection`, `JourneySection`, and `MentorsSection`
- **AND** section ids are `about-hero`, `about-features`, `about-journey`, `about-team`
- **AND** the hero omits homepage badges (Course/Learners/stats) and Features omit Last month / Learning Progress
- **AND** Mastermind-only About classes (`.about-us__hero`, `.about-us__cta-band`) are omitted

#### Scenario: Unpublished about page

- **GIVEN** `about.publishPage` is false or About has no renderable content
- **WHEN** a visitor opens `/about`
- **THEN** they are redirected to the brand homepage `/`

### Requirement: Optional homepage About section

Brands MAY show an About block on the homepage.

#### Scenario: Homepage toggle on

- **GIVEN** `sections.about` is enabled and About has content
- **WHEN** the public homepage renders
- **THEN** `#about` appears with a condensed About teaser (story + features and/or team preview) and a link to `/about` when the full page is published

#### Scenario: Homepage toggle off

- **GIVEN** `sections.about` is disabled
- **WHEN** the public homepage renders
- **THEN** the About homepage block is omitted (full `/about` may still be available)

### Requirement: Team photo grid

About team members SHALL render like a franchise About team grid.

#### Scenario: Member photos

- **GIVEN** members with `photoUrl` values
- **WHEN** About renders on `/about` or homepage
- **THEN** each member shows a portrait photo, name, and role
- **AND** missing photos show a placeholder

### Requirement: Nav presets

Homepage nav editors SHALL offer About destinations.

#### Scenario: Nav link options

- **GIVEN** a brand admin edits Navigation links
- **WHEN** they open the Link dropdown
- **THEN** options include `About page (/about)` and `About section (#about)`
