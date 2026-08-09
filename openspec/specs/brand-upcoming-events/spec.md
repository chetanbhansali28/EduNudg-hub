# Brand upcoming events

## Purpose

Brand (and center template) homepage editors can add an **Upcoming events** section — competitions, workshops, demos, and other events — shown on public marketing sites for all themes when enabled and when upcoming items exist.

## Requirements

### Homepage section like leadership profiles

GIVEN a brand admin opens Homepage Configuration
WHEN they enable **Upcoming events** and add event cards (type, title, start date, optional end date, time, duration, location, image, CTA)
THEN the config is saved in `brand_settings.settings.landing.upcomingEvents`
AND the public brand homepage renders `#events` with date-badge cards

### Upcoming-only visibility

GIVEN events with past and future dates
WHEN the public homepage renders
THEN only events whose end date (or start date if no end) is today or later are shown
AND items are sorted soonest-first
AND `maxItems` caps how many cards appear when set

### Empty hide

GIVEN the section is enabled but no upcoming events remain
WHEN the public homepage renders
THEN the Upcoming events block is omitted

### All themes

GIVEN Abacus Classic, Spark Academy, or Novu brand themes
WHEN upcoming events are configured
THEN each theme layout includes the shared `UpcomingEventsSection`

### Optional media

GIVEN an event with an uploaded cover image in `brand-assets`
WHEN the section renders
THEN the card shows the image
AND saves use `preserveCustomMarketingMediaUrls` so stock URLs cannot wipe uploads
