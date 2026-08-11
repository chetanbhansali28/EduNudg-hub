# Brand About Us

## Purpose

Brand marketing sites can publish a Mastermind-style **About Us** page (`/about`) with company story, differentiators, longer “what we do” copy, and a team photo grid (photo → name → role). The same content can optionally appear as a homepage `#about` teaser.

## Requirements

### Brand About Us editor

GIVEN a brand admin opens Homepage Configuration
WHEN they edit About Us fields (story, philosophy, features, team members with photos) and save
THEN the config is stored in `brand_settings.settings.landing.about`
AND uploads use `brand-assets`
AND saves run `preserveCustomMarketingMediaUrls`

### Dedicated public About page

GIVEN `about.publishPage` is not false and About has content
WHEN a visitor opens `/about` on the brand host
THEN the Mastermind-style page renders (hero, story, philosophy, features, what we do, team grid, optional CTAs)

GIVEN About is unpublished or empty
WHEN a visitor opens `/about`
THEN they are redirected to `/`

### Optional homepage section

GIVEN `sections.about` is enabled and About has content
WHEN the public homepage renders
THEN `#about` appears after Gallery on Abacus Classic (after FAQ on Spark/Novu) with a condensed About teaser and a link to `/about` when the page is published
AND public nav includes About Us → `#about` unless `/about` or `#about` already exists

GIVEN `sections.about` is disabled
WHEN the public homepage renders
THEN the About homepage block is omitted (full `/about` may still be available)
AND the auto-injected About Us nav link is omitted

### Nav presets

GIVEN a brand admin edits nav links
WHEN they open the Link dropdown
THEN options include `About page (/about)` and `About section (#about)`
