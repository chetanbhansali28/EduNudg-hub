# Platform settings

Platform admin configuration at `/admin/settings`.

## Integration toggles

GIVEN a platform admin on `/admin/settings`
WHEN they change authentication, payment, or public website toggles and click **Save Changes**
THEN the values persist in `platform_settings` key `integrations`
AND the UI reflects saved state after reload.

The Authentication card SHALL include toggles for Email & Password, Google SSO, Facebook SSO, WhatsApp OTP, and Passkeys.

## Maintenance export

GIVEN a platform admin on `/admin/settings`
WHEN they click **Export Data** under Maintenance
THEN the app fetches tenant data via Supabase (respecting platform-admin RLS)
AND downloads an Excel workbook (`.xlsx`) named `edunudg-platform-export-YYYY-MM-DD.xlsx`
AND the workbook contains sheets:

| Sheet | Contents |
|-------|----------|
| Brands | id, slug, name, status, marketing theme, logo URL, active center count, subscription plan/status/period, created/updated timestamps |
| Franchise Centers | center id, brand name/slug, center slug/name/display name, status, region, city, country, address, pincode, phone, description, timestamps |
| Students | student id, brand, identity/contact/profile fields, center enrollment (center, status, program, level, enrolled/ended dates); one row per enrollment; students without enrollments appear once with blank enrollment columns |
| Summary | export timestamp and row counts |

AND the export MUST NOT download integration toggle JSON (`platform-settings-export.json`).

WHEN export is in progress
THEN the button label shows **Exporting…** and is disabled until complete or failed.

WHEN export fails (network, RLS, query error)
THEN a mutation error is shown on the settings page.

## CSV format (helper)

The export helper also supports CSV output (one file per sheet) for scripts and tests; the settings UI uses Excel by default.
