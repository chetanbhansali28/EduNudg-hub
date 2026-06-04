# Portal host matrix

Canonical reference for which experiences run on which hostname. Implementation must read `portalType` / `portalMode` from tenant resolution — not infer from URL fragments alone.

## Summary table

| Portal | Example host | Public `/` | Staff app | Who pays EduNudg |
|--------|--------------|------------|-----------|-------------------|
| **Platform (EduNudg)** | `localhost:9000` | Product marketing + **brand signup to EduNudg** | `/admin/*` | **Brands** (subscription) |
| **Brand** | `abacusworld.localhost:9000` | Franchise application + student application | `/app/*` | Brand (not franchise) |
| **Center (franchise)** | `koramangala.abacusworld.localhost:9000` | Student registration only | `/app/*` | Nobody |
| **Learn (student)** | `learn.*` (Phase D) | — | Dashboard + Profile (v1) | Nobody |
| **Parents** | `parents.*` (Phase D+) | — | TBD | Nobody |

## Public surface rules

| Must appear | Platform | Brand | Center |
|-------------|:--------:|:-----:|:------:|
| EduNudg brand signup (B2B) | Yes | No | No |
| Franchise application | No | Yes | No |
| Student application (`lead_source = brand`) | No | Yes | No |
| Student registration (`lead_source = center`) | No | No | Yes |
| Brand logo in nav | EduNudg | Brand | Brand only |
| Center / franchise logo in nav | No | No | **No** |

## When hosts go live

| Host | Condition |
|------|-----------|
| Platform | Always |
| Brand | `platform_brand_signups` approved (or admin-created) + `brands.status = active` + primary `domain_mappings` row |
| Center | `approve_franchise_inquiry` (or manual center create) + `{center_slug}.{brand_slug}` domain mapping |
| Learn | Student enrolled + auth linked (Phase D) |

## Subscription vs public forms

- **Brand public forms are not gated on paid subscription** (brand may owe platform; marketing still works).
- **Franchise never purchases an EduNudg subscription.**

## Related docs

- [Navigation spec](./navigation-spec.md) — sidebar menus per portal
- [Data flow](./data-flow.md) — how records move between portals
- [Functional requirements](./functional-requirements.md) — FR IDs
