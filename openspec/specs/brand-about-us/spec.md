# Brand About Us

## Purpose

Brand marketing sites can publish a themed **About Us** page (`/about`) with company story, differentiators, longer “what we do” copy, and a team photo grid (photo → name → role). Chrome follows `brands.marketing_theme` (Novu Mastermind, Abacus Classic, or Spark Academy). The same content can optionally appear as a homepage `#about` teaser.

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
THEN the About page renders (hero, story, philosophy, features, what we do, team grid, optional CTAs)
AND the root uses a theme modifier (`about-us--novu`, `about-us--abacus-classic`, or `about-us--spark-academy`) matching `brands.marketing_theme`

GIVEN a Spark Academy brand
WHEN a visitor opens `/about`
THEN the page uses Spark tokens (light hero, Inter type scale, Spark pill CTAs) instead of Mastermind navy chrome
AND enroll/franchise CTAs use `SparkAcademyCta` (lead modals when the layout provides them)

GIVEN About is unpublished or empty
WHEN a visitor opens `/about`
THEN they are redirected to `/`

### Optional homepage section

GIVEN `sections.about` is enabled and About has content
WHEN the public homepage renders
THEN `#about` appears after Gallery on Abacus Classic and Spark Academy (after FAQ when Spark has no photos) with a condensed About teaser and a link to `/about` when the page is published
AND public nav includes About Us → `#about` unless `/about` or `#about` already exists

GIVEN `sections.about` is disabled
WHEN the public homepage renders
THEN the About homepage block is omitted (full `/about` may still be available)
AND the auto-injected About Us nav link is omitted

### Nav presets

GIVEN a brand admin edits nav links
WHEN they open the Link dropdown
THEN options include `About page (/about)` and `About section (#about)`

### Spark Academy nav presets

GIVEN a Spark Academy brand admin edits Navigation & CTAs
WHEN they open a menu item Link dropdown
THEN options SHALL NOT include `Programs (#programs)` or `About us (#features)`
AND courses use `Courses (#programs)` (Spark `#curriculum` is an in-section alias, not a second option)
AND the features block uses `Features (#features)`
AND About page (`/about`) and About section (`#about`) remain available
AND options include `Photo gallery (#gallery)` when the Photo gallery section is on

### Spark Academy photo gallery

GIVEN a Spark Academy public homepage
AND Homepage Configuration **Photo gallery** has at least one image URL
WHEN a visitor opens the brand site
THEN `#gallery` renders those images and title
AND empty or URL-less slots are omitted
AND the section sits after FAQ and before About Us

### Spark Academy heading type scale

GIVEN a Spark Academy public homepage
WHEN section titles render (courses, features, journey, mentors, testimonials, FAQ, gallery, About teaser, upcoming events)
THEN they share Inter, `--sa-h2-size` (`clamp(1.75rem, 4vw, 2.25rem)`), weight 800, and navy color
AND card / list headings share `--sa-h3-size` (1.0625rem, weight 700)
AND the hero remains the larger display title (`--sa-h1-size`)
AND footer column labels stay small uppercase chrome (not section titles)

