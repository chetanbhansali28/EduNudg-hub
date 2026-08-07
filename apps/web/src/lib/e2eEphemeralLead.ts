/**
 * Identify student leads created by ephemeral E2E runs so they can be
 * permanently purged without touching real pipeline data.
 */

/** Canonical E2E lead emails: `e2e-lead-${tag}@example.com`. */
export function isE2EEphemeralLeadEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (/^e2e-lead-.+@example\.com$/.test(normalized)) return true;
  // Legacy prefixes used before the e2e-lead- convention.
  return /^(path-a-|path-b-|lost-|merge-|stale-|manual-|neg-).+@example\.com$/.test(normalized);
}

export function isE2EEphemeralLeadParentName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (/^E2E Parent\b/i.test(trimmed)) return true;
  return [
    "Path A Parent",
    "Path B Parent",
    "Lost Parent",
    "Merge Parent",
    "Stale Parent",
    "Manual Brand Parent",
    "Neg Parent",
  ].includes(trimmed);
}

export function isE2EEphemeralLeadChildName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (/^E2E Child\b/i.test(trimmed)) return true;
  if (/^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child)\b/i.test(trimmed)) {
    return true;
  }
  // e2e-03 legacy: `Child ${base36}`
  return /^Child [a-z0-9]+$/i.test(trimmed);
}

export function isE2EEphemeralLeadFullName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (/^E2E (Parent|Child)\b/i.test(trimmed)) return true;
  return isE2EEphemeralLeadParentName(trimmed) || isE2EEphemeralLeadChildName(trimmed);
}

/** True when any lead identity field matches ephemeral E2E markers. */
export function isE2EEphemeralLead(row: {
  email?: string | null;
  parent_name?: string | null;
  child_name?: string | null;
  full_name?: string | null;
}): boolean {
  if (isE2EEphemeralLeadEmail(row.email)) return true;
  if (isE2EEphemeralLeadParentName(row.parent_name)) return true;
  if (isE2EEphemeralLeadChildName(row.child_name)) return true;
  if (isE2EEphemeralLeadFullName(row.full_name)) return true;
  return false;
}

/** SQL predicate fragment (no leading WHERE) matching ephemeral E2E leads. */
export const E2E_EPHEMERAL_LEAD_SQL_PREDICATE = `(
  email ~* '^e2e-lead-.+@example\\.com$'
  OR email ~* '^(path-a-|path-b-|lost-|merge-|stale-|manual-|neg-).+@example\\.com$'
  OR parent_name ~* '^E2E Parent\\b'
  OR child_name ~* '^E2E Child\\b'
  OR full_name ~* '^E2E (Parent|Child)\\b'
  OR parent_name IN (
    'Path A Parent', 'Path B Parent', 'Lost Parent', 'Merge Parent',
    'Stale Parent', 'Manual Brand Parent', 'Neg Parent'
  )
  OR child_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child)\\b'
  OR child_name ~* '^Child [a-z0-9]+$'
)`;
