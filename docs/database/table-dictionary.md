# Table Dictionary

## Audit columns (mutable tables)

All mutable business tables: `created_at`, `updated_at`, `created_by`, `updated_by` + `set_row_audit()` trigger.

## Append-only (no updated_by)

| Table | Notes |
|-------|-------|
| `financial_events` | `created_by` only |
| `platform_audit_logs` | `created_by` only |
| `enrollment_history` | `created_by` only |
| `brand_status_events` | `created_by` only |
| `auth_audit_logs` | `created_by` only |
| `lead_events` | timeline |
| `lead_assignment_history` | reassignments |

## Core

| Table | Scope | Description |
|-------|-------|-------------|
| `profiles` | user | Extended auth user profile |
| `brands` | platform | Franchise brand tenant |
| `franchise_centers` | brand | Physical center / franchise; public profile fields below |
| `memberships` | auth | User role per scope |
| `domain_mappings` | routing | Hostname → portal |
| `platform_brand_signups` | platform | Self-serve EduNudg brand signup queue |

### `franchise_centers` public profile (migration `046`)

| Column | Type | Notes |
|--------|------|-------|
| `display_name`, `short_description` | text | Shown on center public site |
| `address_line1`, `city`, `region`, `pincode`, `country` | text | Location |
| `contact_phone` | text | Phone / WhatsApp on public site; staff email from auth (Google/social login) |
| `photo_url` | text | `brand-assets` path `{brand_id}/centers/{center_id}/photo.{ext}` |
| `social_links` | jsonb | Array of `{platform, url}` (max 6) |

Center staff update via RPC `update_center_public_profile_rpc` (requires `has_center_access`).

## Leads & recruitment

| Table | Scope | Description |
|-------|-------|-------------|
| `leads` | brand / center | Student pipeline; `lead_source` brand \| center; nullable `center_id` |
| `lead_events` | brand | Merge, lost, reopen, assign audit |
| `lead_assignment_history` | brand | Center reassignments |
| `franchise_inquiries` | brand | Prospective franchisee applications |

## Students

| Table | Scope | Description |
|-------|-------|-------------|
| `students` | brand | `source_lead_id` optional lineage |
| `student_profiles` | brand | Extended profile JSON/columns |

## Merchandise (Phase D)

| Table | Scope | Description |
|-------|-------|-------------|
| `merchandise_catalog` | brand | SKUs centers can order (see columns below) |
| `merchandise_orders` | center | Orders to brand |
| `merchandise_order_lines` | center | Line items (optional `student_id`) |
| `student_merchandise_allocations` | center | Hidden from student portal |
| `merchandise_promo_codes` | brand | Checkout promo codes |
| `merchandise_invoices` | center | Per-order invoices |
| `merchandise_payments` | center | Payment records |
| `merchandise_reminder_log` | center | Payment reminder audit |
| `student_level_progress` | center | Level progress shown on learn dashboard |
| `brand_competitions` | brand | Competition calendar |
| `student_competition_entries` | center | Student competition results |

### `merchandise_catalog` columns (notable)

| Column | Type | Notes |
|--------|------|-------|
| `photo_urls` | `text[]` | Up to 5 public image URLs; slot *n* stored at index *n−1*. Files live in `brand-assets` at `{brand_id}/merchandise/{id}/photo-{1-5}.{ext}`. Re-upload replaces same slot. |

Centers with `merchandise` enabled can **SELECT** active rows for their brand (policy `merchandise_catalog_center_read`, migration `045`).

## Campaigns & ops (Phase E)

| Table | Scope | Description |
|-------|-------|-------------|
| `brand_campaigns` | brand | Promotions for centers (mutations via RPC) |
| `student_assessments` | center | Level checks and scores (mutations via RPC) |
| `brand_success_stories` | brand | Parent/franchise testimonials (brand-managed CRUD) |

## Curriculum extensions (`019`)

| Column | Table | Purpose |
|--------|-------|---------|
| `why_take`, `what_you_learn`, `marketing_video_url` | `programs`, `levels` | Abacus marketing copy |
| `abacus_level_code`, `topics_covered` | `levels` | Level label + topic list (jsonb array) |

## Settings JSON keys (`brand_settings.settings`)

| Key | Default | Purpose |
|-----|---------|---------|
| `lead_stale_days` | 15 | SLA after assign |
| `timezone` | Asia/Kolkata | Display + SLA |
| `features` | object | Module flags |
| `integrations` | object | Auth/payment flags |
| `landing` | object | Marketing copy |

## Public RPC

| Function | Description |
|----------|-------------|
| `get_portal_branding` | Login white-label |
| `get_brand_landing_public` | Brand marketing |
| `submit_franchise_inquiry_v2` | Franchise application |
| `submit_brand_student_application` | Student application (`lead_source=brand`) |
| `get_center_landing_public` | Center marketing (brand logo only) |
| `submit_center_student_registration` | Center registration (`lead_source=center`) |
| `submit_platform_brand_signup` | Platform B2B signup |
| `approve_platform_brand_signup` | Platform admin |
| `suggest_centers_for_lead` | Pincode suggestions |
| `assign_lead_to_center` / `reassign_lead` | Brand manual assign |
| `update_lead_status` | Center SLA reset |
| `mark_lead_lost` | Center only |
| `reopen_lead` | Brand only |
| `convert_lead_to_student` | Center staff |
| `create_platform_brand_signup_staff` | Platform manual brand signup |
| `create_franchise_inquiry_staff` | Brand manual franchise application |
| `create_brand_student_lead_staff` | Brand manual student lead |
| `create_center_student_lead_staff` | Center manual student lead |

See migrations `016`–`019`.
