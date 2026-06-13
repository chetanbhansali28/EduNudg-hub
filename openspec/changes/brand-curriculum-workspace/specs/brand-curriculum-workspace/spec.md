# Brand curriculum workspace

## Master-detail layout

GIVEN a brand user on `/app/curriculum`
WHEN the page loads
THEN col 1 lists courses and col 2 shows the selected course detail

## Publish workflow

GIVEN a course with a draft version and at least one level
WHEN the brand user publishes
THEN the version status becomes published and appears on the public website and center batch picker

## Live edit safety

GIVEN a course with only a published version (no draft)
WHEN the brand user attempts to add or edit levels/units
THEN they must create a draft clone first; live content is not edited in place

## Units CRUD

GIVEN a selected level in draft mode
WHEN the brand user adds, edits, reorders, or deletes units
THEN changes persist under the level's default Units module

## Delete guards

GIVEN a level referenced by student progress or an active batch range
WHEN the brand user attempts to delete the level
THEN the operation is blocked with a clear message
