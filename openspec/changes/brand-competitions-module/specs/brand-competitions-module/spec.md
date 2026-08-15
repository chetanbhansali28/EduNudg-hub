## ADDED Requirements

### Requirement: Platform admin can toggle Competitions per brand

The system SHALL expose a **Competitions** toggle on the platform brand Features card. Saving SHALL persist `brand_settings.settings.features.competitions` as a boolean. When the key is absent, the effective value SHALL be **false**.

#### Scenario: Admin enables Competitions for one brand

- **GIVEN** platform admin is on `/admin/brands/:slug`
- **WHEN** they turn Competitions ON and Save
- **THEN** that brand’s portal can use Competitions
- **AND** other brands are unaffected

#### Scenario: Default is off

- **GIVEN** a brand with no `competitions` key in `settings.features`
- **WHEN** feature resolution runs (client or `brand_feature_enabled`)
- **THEN** Competitions is treated as disabled

### Requirement: Full gate when Competitions is off

When Competitions is disabled for a brand, the system SHALL hide the brand Competitions nav item, redirect `/app/competitions` to `/app`, hide student Events nav and `/competitions`, reject competition/bank/quiz mutations with `feature_disabled`, and omit competition cards from `get_student_learn_home`.

#### Scenario: Brand staff cannot open Competitions when off

- **GIVEN** `features.competitions` is false for the brand
- **WHEN** brand staff navigates to `/app/competitions`
- **THEN** they are redirected to `/app`
- **AND** the Competitions sidebar item is not shown

#### Scenario: Student Events hidden when off

- **GIVEN** `features.competitions` is false for the brand
- **WHEN** an enrolled student opens the learn portal
- **THEN** Events is omitted from sidebar and bottom nav
- **AND** `/competitions` redirects to `/`
- **AND** `upcoming_competitions` is an empty array

#### Scenario: Competition RPC rejects when off

- **GIVEN** `features.competitions` is false
- **WHEN** an authenticated caller invokes `upsert_brand_competition` or a bank/quiz RPC
- **THEN** the RPC raises `feature_disabled`

### Requirement: Platform admins can mutate competitions on the brand portal

Platform admins using Brand backend handoff SHALL create, update, and delete events and question-bank items the same as brand owners. Client authorization SHALL grant competitions create/update/delete to `platform_super_admin` and `platform_ops`, and SHALL evaluate **any** active membership (not only `primaryRole`, which prefers platform).

#### Scenario: Platform admin Brand backend can add events

- **GIVEN** the signed-in user has `platform_super_admin` (and may have no brand_owner membership)
- **WHEN** they open `/app/competitions` on a brand host with Competitions enabled
- **THEN** Add competition and Add question controls are shown
- **AND** mutation RPCs succeed via `is_platform_admin()`

### Requirement: Competitions is a brand nav module separate from Merchandise

Brand staff SHALL manage competitions at `/app/competitions`. The Merchandise page SHALL NOT include a Competitions tab. Enabling `merchandise` SHALL NOT enable Competitions.

#### Scenario: Merchandise catalog has no Competitions tab

- **GIVEN** brand staff is on `/app/merchandise`
- **WHEN** the page renders
- **THEN** section tabs are Catalog, Promo Codes, Orders, and Payment settings
- **AND** no Competitions tab is present

#### Scenario: Brand nav lists Competitions when on

- **GIVEN** `features.competitions` is true
- **WHEN** brand staff views the Features sidebar
- **THEN** Competitions links to `/app/competitions`

### Requirement: Brand question bank by curriculum course and level

Brand owners SHALL create multiple-choice questions with 2–6 options and at least one correct answer, tagged to a `program_id` (course) and `level_id`.

#### Scenario: Create a bank question

- **GIVEN** brand staff on `/app/competitions` Question bank tab
- **WHEN** they save a prompt, course, level, and 2–6 options with at least one marked correct
- **THEN** `upsert_competition_bank_question` stores the row and options

#### Scenario: Invalid option count rejected

- **GIVEN** brand staff submits a question with fewer than 2 or more than 6 options, or zero correct answers
- **WHEN** the RPC runs
- **THEN** it raises an error and does not insert

### Requirement: Attach questions to a competition by pick or random draw

Brand owners SHALL attach bank questions to a competition as snapshots (prompt, option texts, correct ids). They MAY pick specific questions or add N unused random questions for a course and level. Once any student attempt exists, the attached set SHALL be locked.

#### Scenario: Manual attach snapshots the bank row

- **GIVEN** active bank questions for course C level L
- **WHEN** brand staff selects those ids for competition K
- **THEN** `brand_competition_questions` rows store copied prompt and options
- **AND** later bank edits do not change K’s snapshots

#### Scenario: Random attach does not duplicate

- **GIVEN** 10 unused bank questions for C/L and K already has 2 attached
- **WHEN** brand staff requests 3 random questions for C/L
- **THEN** three new unused questions are snapshotted onto K
- **AND** previously attached questions remain

#### Scenario: Attach locked after first attempt

- **GIVEN** a student attempt exists for competition K
- **WHEN** brand staff tries to add, remove, or reorder attached questions
- **THEN** the RPC raises `QUESTIONS_LOCKED`

### Requirement: Student one-attempt scored quiz

Registered students SHALL take attached questions as a quiz when the competition is active and `event_date` is today or earlier (or null). Scoring SHALL treat a question as correct only when the selected option set equals the correct set. Correct flags SHALL NOT be sent before submit. Submit SHALL upsert `student_competition_entries.score`.

#### Scenario: Take quiz after enroll

- **GIVEN** student S is registered for free competition K with attached questions and `event_date` is today or earlier
- **WHEN** S starts and submits answers
- **THEN** `student_competition_attempts` is `submitted` with score and max_score
- **AND** `student_competition_entries.score` matches the attempt
- **AND** a second start is rejected

#### Scenario: Quiz payload hides answers

- **GIVEN** student S requests `get_student_competition_quiz` before submit
- **THEN** each question includes options `{id, text}` only
- **AND** `correct_option_ids` and `is_correct` are absent

#### Scenario: Event without questions stays enroll-only

- **GIVEN** competition K has zero attached questions
- **WHEN** student S views K
- **THEN** Enroll / withdraw behave as today
- **AND** Take quiz is not shown
