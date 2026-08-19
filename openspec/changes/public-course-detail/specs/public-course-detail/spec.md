## ADDED Requirements

### Requirement: Public course detail URL

Brand and center public sites SHALL expose `/courses/:slug` for each published curriculum program in that host’s `publicCurriculum` payload. The page SHALL render inside the existing public layout so nav, footer, CSS variables, and lead modals match the homepage theme. A slug that does not match an enabled published program SHALL redirect to `/`.

#### Scenario: Spark card opens course page

- **GIVEN** a Spark Academy public homepage with a published course named Junior Abacus
- **WHEN** a visitor activates the course title or media link
- **THEN** the app opens `/courses/junior-abacus`
- **AND** the page heading is Junior Abacus
- **AND** **Enroll now** on the homepage card remains a lead-modal button

#### Scenario: Unknown slug returns home

- **GIVEN** a public brand or center host
- **WHEN** a visitor opens `/courses/not-a-real-course`
- **THEN** they are redirected to `/`

#### Scenario: Center disabled course is not addressable

- **GIVEN** a center host whose `publicCurriculum` omits a brand course that is not in `center_program_enablement`
- **WHEN** a visitor opens that course’s slug on the center host
- **THEN** they are redirected to `/`

### Requirement: Detail page shows curriculum marketing fields

The course page SHALL show the published program’s public fields when present: banner, age label, description, preview video, why parents choose (`whyTake`), skills and outcomes (`whatYouLearn`), benefit bullets, scholarship highlight, and the level → module → lesson tree. Empty fields SHALL be omitted. Staff-only impact chips SHALL NOT appear.

#### Scenario: Full published record

- **GIVEN** a published course with benefits, whyTake, whatYouLearn, scholarship, and a lesson titled Bead basics
- **WHEN** a visitor opens its `/courses/:slug` page
- **THEN** those fields and the lesson title are visible

### Requirement: Abacus Know More uses the course page for published programs

When an Abacus Classic program card matches a published curriculum program by name, **Know More →** SHALL be a link to `/courses/:slug` rather than the short details modal. Homepage-only cards with no matching published program MAY keep the modal.

#### Scenario: Published Abacus course

- **GIVEN** an Abacus Classic programs grid item that matches a published curriculum program
- **WHEN** a visitor activates **Know More →**
- **THEN** the browser navigates to that program’s `/courses/:slug` page
- **AND** the short Course Details modal is not opened
