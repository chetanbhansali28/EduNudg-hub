## Context

`auth_audit_logs` is append-only with SELECT for the actor or platform admin. Direct INSERT requires `user_id = auth.uid()`, so failed logins (no JWT) cannot use the table from the SPA. Token refresh fires `SIGNED_IN`, so login must be deduped by auth `session_id`.

## Goals / Non-Goals

**Goals:** reliable auth events; never block login if audit fails; platform ops can filter Auth vs Mutations; capture IP only from the Edge Function.

**Non-Goals (later phases):** every staff route view; brand/center audit UI; client error inbox; retention jobs.

## Decisions

1. **Writer:** SECURITY DEFINER `log_auth_audit_event`. Anon may call it only for `login_failure`. Authenticated callers are forced to `user_id = auth.uid()`. RPC never accepts IP fields (clients cannot spoof).
2. **Network metadata:** Edge Function `auth-audit` calls the RPC then service-role UPDATEs `ip_address`, `ip_hash`, `ip_country`. SPA tries invoke first, falls back to RPC.
3. **Dedup:** skip insert of `login_success` when the same `session_id` already has that event in 12 hours.
4. **Failed identifiers:** store SHA-256 hash plus raw identifier in `metadata` (platform-only SELECT in Phase A). Strip password/token keys from metadata.
5. **UI:** map auth rows into the existing audit table with `source: "auth"`. Stream filter All / Mutations / Auth. Portal filter All / Staff / Learn / Parent.

## Risks / Trade-offs

- Edge Function not deployed → logs still persist, IP columns stay null.
- Anon `login_failure` can be spammed → hourly cap per identifier hash.
- Brand_id on anonymous failure is client-supplied; invalid FKs are stored as null.
