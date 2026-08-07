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

### Requirement: Delete guards

The system SHALL block level deletes that would break student progress or active batch ranges.

#### Scenario: Block delete of referenced level

- **GIVEN** a level referenced by student progress or an active batch range
- **WHEN** the brand user attempts to delete the level
- **THEN** the operation is blocked with a clear message
