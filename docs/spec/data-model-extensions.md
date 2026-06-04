# Data model extensions (migration 016+)

Delta from current schema. Update [`erd.mmd`](../database/erd.mmd) when migration lands.

## `brand_settings.settings` (JSON keys)

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `lead_stale_days` | integer | `15` | Days after assign before stale (IST calendar) |
| `timezone` | string | `Asia/Kolkata` | SLA + display timestamps for brand |
| `landing` | object | — | Existing marketing JSON |

Platform default timezone: `platform_settings.timezone` = `Asia/Kolkata` (new key or column).

## `platform_brand_signups` (new)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| requested_name | text NOT NULL | |
| admin_full_name | text NOT NULL | |
| email | text NOT NULL | unique among pending |
| phone_e164 | text | |
| city | text NOT NULL | slug |
| country | text | |
| message | text | |
| status | text | pending, approved, rejected |
| proposed_slug | text | set on approve |
| converted_brand_id | uuid FK | |
| lost_reason | — | N/A |
| audit columns | | |

## `franchise_inquiries` (extend)

`proposed_franchise_name`, `address_line`, `state`, `pincode`, `prior_experience`, `converted_center_id`, `rejected_reason`.

## `franchise_centers` (extend)

`pincode`, `city`, `display_name`, `contact_phone`, `short_description`, `address_line` (public blurb; not logo).

## `leads` (extend)

| Column | Type | Notes |
|--------|------|-------|
| lead_source | text | `brand`, `center` |
| whatsapp_e164 | text NOT NULL | unique per brand (active) |
| parent_name | text | |
| child_dob | date | |
| pincode | text | 6-digit India |
| city | text NOT NULL for brand applications |
| school_name | text | |
| center_id | uuid nullable | |
| assigned_at | timestamptz | |
| assigned_by | uuid | |
| last_center_action_at | timestamptz | |
| stale_at | timestamptz | computed on assign |
| lost_reason | text | required when status=lost |
| source_lead_id | — | use `students.source_lead_id` FK to leads |

**Unique index:** `(brand_id, whatsapp_e164)` WHERE `deleted_at IS NULL` AND `status != 'lost'` — use merge in RPC; on lost, allow same WhatsApp to reopen same row.

**`lead_events` (new):** `lead_id`, `event_type`, `payload jsonb`, `created_at` — merge, lost, reopen, assign, reassign.

**`lead_assignment_history` (new):** `lead_id`, `from_center_id`, `to_center_id`, `assigned_by`, `created_at`.

## `students` (extend)

`source_lead_id uuid REFERENCES leads(id)` nullable.

## `student_profiles` (new, optional v1)

`student_id`, `school_name`, `city`, `pincode`, `extra jsonb` — or fold into students metadata JSONB for Phase A.

## Pincode suggestion SQL (reference)

```sql
-- Tier 1: exact pincode
-- Tier 2: lower(city) match AND left(pincode,3) match
-- Order tier 2 by abs(right(pincode,3)::int - right(lead_pincode,3)::int)
```

## Timezone

- Store timestamptz in UTC in Postgres (default).
- Compute `stale_at` using brand `timezone` (default `Asia/Kolkata`).
- UI formats with same timezone via `brand_settings.timezone`.

## Related

- [RPC catalog](./rpc-catalog.md)
- [Table dictionary](../database/table-dictionary.md) — update when migrated
