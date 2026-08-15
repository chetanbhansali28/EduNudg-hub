# brand-curriculum-workspace Specification

## Purpose

Brand staff manage curriculum (courses, levels, units) in a master-detail workspace at `/app/curriculum` with draft/publish safety so live published content is not edited in place.

## Related

- Journey: [`docs/journeys/brand-operator.md`](../../../docs/journeys/brand-operator.md)
- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Change archive source: `openspec/changes/brand-curriculum-workspace/`

## Requirements

### Requirement: Master-detail curriculum workspace

Brand staff SHALL manage courses in a two-column layout at `/app/curriculum`.

#### Scenario: Select course shows detail

- **GIVEN** a brand user on `/app/curriculum`
- **WHEN** the page loads
- **THEN** column 1 lists courses and column 2 shows the selected course detail

#### Scenario: Page chrome matches franchise applications

- **GIVEN** a brand user on `/app/curriculum`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Franchise Applications
- **AND** stats cards show Active, Drafts, Programs, and Total
- **AND** **+ Add Curriculum** remains in the page header only

#### Scenario: Add course uses page header only

- **GIVEN** a brand user on `/app/curriculum` on desktop
- **THEN** **+ Add Curriculum** appears in the page header
- **AND** the Courses list has no **+** add button

### Requirement: Publish workflow

Brand staff SHALL publish draft course versions so they appear on the public website and center batch picker.

#### Scenario: Publish draft with levels

- **GIVEN** a course with a draft version and at least one level
- **WHEN** the brand user publishes
- **THEN** the version status becomes published
- **AND** it appears on the public website and center batch picker

### Requirement: Live edit safety

Brand staff SHALL NOT edit published content in place; they MUST create a draft clone first.

#### Scenario: Edit requires draft clone

- **GIVEN** a course with only a published version (no draft)
- **WHEN** the brand user attempts to add or edit levels/units
- **THEN** they must create a draft clone first
- **AND** live content is not edited in place

### Requirement: Units CRUD on draft levels

Brand staff SHALL add, edit, reorder, or delete units under a level's default Units module while in draft mode.

#### Scenario: Persist unit changes on draft

- **GIVEN** a selected level in draft mode
- **WHEN** the brand user adds, edits, reorders, or deletes units
- **THEN** changes persist under the level's default Units module

### Requirement: Course banner upload guidance

Brand staff SHALL see allowed formats, maximum file size, and recommended dimensions when setting a course thumbnail (`marketing_image_url`).

#### Scenario: Thumbnail dropzone shows size limits

- **WHEN** brand staff open a course on `/app/curriculum`
- **THEN** Course Banner (Thumbnail) shows PNG/JPEG/WebP/GIF, maximum 5 MB, and recommended 1280×720 (16:9)
- **AND** uploads larger than 5 MB are rejected before storage

### Requirement: Parent marketing fields persist on existing courses

Brand staff SHALL edit the same parent-facing marketing fields after a course is created as they see while adding it. Those fields SHALL persist on `programs` and remain available via **Save**.

#### Scenario: Created course shows benefits, why parents choose this, and skills

- **GIVEN** a brand user on `/app/curriculum` with an existing course
- **WHEN** they select that course
- **THEN** the course editor shows **Add benefit**, **Why parents choose this**, **Skills and outcomes**, and scholarship highlight
- **AND** saved values from create (or later edits) populate those fields
- **AND** **Save** remains available so the course can be edited after it exists on the backend

#### Scenario: Add-course form includes the same parent marketing fields

- **GIVEN** a brand user opens **Add course**
- **WHEN** they fill benefits, why parents choose this, and skills and outcomes
- **THEN** create persists those values on `programs`
- **AND** selecting the new course shows the same fields for further edits

### Requirement: Course live toggle

Brand staff SHALL turn a course on or off from the course detail header (next to the Active badge and **Save**), without deleting it. The course list SHALL NOT include a live toggle. Off courses remain in `/app/curriculum` so they can be turned back on, and SHALL NOT appear on public programs or franchise batch pickers.

#### Scenario: Toggle lives in course detail, not the list

- **GIVEN** a brand user on `/app/curriculum` with an existing course selected
- **THEN** column 1 (Courses) has no on/off switch
- **AND** column 2 shows the live toggle next to the Active badge, with **Save** beside it, grouped at the right of the header

#### Scenario: Course title uses half the header and wraps

- **GIVEN** a brand user viewing a course in column 2
- **THEN** the course title occupies at most 50% of the header row
- **AND** a long title wraps onto a second line instead of stretching the full row

#### Scenario: Toggle off hides a course from public surfaces

- **GIVEN** a brand user on `/app/curriculum` with an existing course
- **WHEN** they turn the course off
- **THEN** `programs.is_active` becomes false
- **AND** the course stays listed in the curriculum workspace
- **AND** public curriculum JSON and center batch pickers omit it

#### Scenario: Toggle on restores a course

- **GIVEN** an inactive (off) course that is not deleted
- **WHEN** the brand user turns the course on
- **THEN** `programs.is_active` becomes true
- **AND** it appears again on public programs and franchise batches

### Requirement: Spark Academy courses use published syllabus

On Spark Academy public sites, **Courses designed for success** SHALL show that brand’s published `/app/curriculum` catalog (the same `publicCurriculum` RPC payload as Curriculum syllabus). Homepage `programsSection` cards SHALL NOT hide published courses. Cards are a fallback only when no published courses exist.

#### Scenario: Published curriculum wins over leftover program cards

- **GIVEN** a Spark Academy brand landing whose stored `programsSection` still has named marketing cards
- **AND** `get_brand_landing_public` returns published curriculum programs
- **WHEN** a visitor opens the public homepage
- **THEN** **Courses designed for success** lists the published course names, descriptions, age labels, and lesson counts
- **AND** it does not list leftover homepage card names such as Abacus (Mental Math) unless those names are the published courses

#### Scenario: Course card keeps Enroll now and centers rating below

- **GIVEN** a Spark Academy public homepage with at least one published course
- **WHEN** a visitor views **Courses designed for success**
- **THEN** each course card has an **Enroll now** control
- **AND** it does not show a separate **Enroll** price/link
- **AND** the star rating appears below **Enroll now**, centered like the button

#### Scenario: Courses section has no curriculum filter tabs

- **GIVEN** a Spark Academy public homepage with published curriculum courses
- **WHEN** a visitor views **Courses designed for success**
- **THEN** all published course cards are visible in one grid
- **AND** there are no **All courses** / course-name filter tabs

### Requirement: Delete guards

The system SHALL block level deletes that would break student progress or active batch ranges.

#### Scenario: Block delete of referenced level

- **GIVEN** a level referenced by student progress or an active batch range
- **WHEN** the brand user attempts to delete the level
- **THEN** the operation is blocked with a clear message
