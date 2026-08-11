## Context

Brand landings store marketing JSON in `brand_settings.settings.landing`. Patterns already exist for list sections (upcoming events, founders) with `MarketingMediaField`, section toggles, and `preserveCustomMarketingMediaUrls`.

Reference layout: [Mastermind About Us](https://www.mastermindabacus.com/about-us/) — hero banner, about copy + image, philosophy, numbered differentiators, longer “what we do”, team grid (photo → name → role), dual CTAs.

## Goals / Non-Goals

**Goals**

- Brand owners edit About content in `/app/homepage`.
- Public `/about` when `about.publishPage` is true and content exists.
- Optional homepage `#about` when `sections.about` is enabled.
- Team grid visually like Mastermind (portrait photo, name, role).
- Media URLs preserved on save.

**Non-Goals**

- Platform About page.
- Center-specific About editor (v1 uses brand landing only).
- Hardcoding Mastermind’s real company copy as permanent product text.
- Replacing existing founders/leadership section (About team is separate).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | `landing.about` + `sections.about` | Matches events/founders; no migration |
| Scope | Brand public only | User request |
| Team vs founders | Separate `about.members` | Different UI (grid vs bio profiles); brands may want both |
| Homepage default | `sections.about: false` | Avoid surprising layout; page publish default true when section saved with content |
| Themes | Shared About components in all brand themes | Same as UpcomingEventsSection |

## Data model

```ts
about: {
  heroHeadline?, heroSubtitle?,
  title?, body?, imageUrl?,
  philosophyTitle?, philosophyBody?,
  differentTitle?, features: [{ id, title, body }],
  whatWeDoTitle?, whatWeDoBody?,
  teamTitle?, members: [{ id, name, role, photoUrl, bio? }],
  publishPage?: boolean, // default true
  // optional CTA band copy/hrefs
}
sections.about?: boolean // homepage block
```

## Risks / Mitigations

- **Empty /about 404-like UX** — If `publishPage` false or no content, redirect to `/` or show empty state with nav; prefer redirect to `/` when unpublished.
- **Media wipe** — Extend `marketingMediaGuard` for `about.imageUrl` and `about.members[].photoUrl`.
- **Nav confusion** — Offer both `#about` and `/about` in nav dropdown.

## Migration

None (JSON settings only).
