import { E2E_EPHEMERAL_LEAD_SQL_PREDICATE } from "../../apps/web/src/lib/e2eEphemeralLead";
import { uniqueWhatsApp } from "./auth";
import { hasDatabaseUrl } from "./env";
import { withSqlClient } from "./sql";

export {
  isE2EEphemeralLeadChildName,
  isE2EEphemeralLeadEmail,
  isE2EEphemeralLeadParentName,
} from "../../apps/web/src/lib/e2eEphemeralLead";

export type PurgeEphemeralE2ELeadsResult = {
  leadsDeleted: number;
  studentsUnlinked: number;
};

export type E2ELeadFields = {
  parentName: string;
  childName: string;
  email: string;
  whatsapp: string;
  city: string;
  pincode: string;
};

/**
 * Canonical markers for student-lead E2E so SQL purge can hard-delete leftovers.
 * Prefer this over ad-hoc names/emails in every lead-creating spec.
 */
export function makeE2ELeadFields(opts?: { tag?: string; whatsapp?: string }): E2ELeadFields {
  const tag = opts?.tag ?? Date.now().toString(36);
  return {
    parentName: `E2E Parent ${tag}`,
    childName: `E2E Child ${tag}`,
    email: `e2e-lead-${tag}@example.com`,
    whatsapp: opts?.whatsapp ?? uniqueWhatsApp(),
    city: "Bengaluru",
    pincode: "560034",
  };
}

/**
 * Hard-delete every student lead created by E2E (email / name patterns).
 * Unlinks students.source_lead_id first; never touches non-matching leads.
 */
export async function hardDeleteEphemeralE2ELeadsViaSql(): Promise<PurgeEphemeralE2ELeadsResult> {
  return withSqlClient(async (client) => {
    try {
      const rpc = await client.query<{ result: unknown }>(
        `SELECT public.purge_ephemeral_e2e_leads() AS result`
      );
      const raw = rpc.rows[0]?.result;
      const row =
        typeof raw === "string"
          ? (JSON.parse(raw) as { leads_deleted?: number; students_unlinked?: number })
          : (raw as { leads_deleted?: number; students_unlinked?: number } | null);
      if (row && typeof row.leads_deleted === "number") {
        return {
          leadsDeleted: row.leads_deleted,
          studentsUnlinked: row.students_unlinked ?? 0,
        };
      }
    } catch {
      // Function missing — use inline purge below.
    }

    const doomed = await client.query<{ id: string }>(
      `SELECT id::text FROM public.leads WHERE ${E2E_EPHEMERAL_LEAD_SQL_PREDICATE}`
    );
    const ids = doomed.rows.map((r) => r.id);
    if (ids.length === 0) {
      return { leadsDeleted: 0, studentsUnlinked: 0 };
    }

    const unlinked = await client.query(
      `UPDATE public.students
       SET source_lead_id = NULL, updated_at = now()
       WHERE source_lead_id = ANY ($1::uuid[])`,
      [ids]
    );
    const deleted = await client.query(`DELETE FROM public.leads WHERE id = ANY ($1::uuid[])`, [ids]);

    return {
      leadsDeleted: deleted.rowCount ?? 0,
      studentsUnlinked: unlinked.rowCount ?? 0,
    };
  });
}

/** Hard-delete one lead by WhatsApp (E.164 or 10-digit IN) when known from the test. */
export async function hardDeleteLeadByWhatsappViaSql(
  brandId: string,
  whatsapp: string
): Promise<number> {
  return withSqlClient(async (client) => {
    const wa = whatsapp.startsWith("+")
      ? whatsapp
      : `+91${whatsapp.replace(/\D/g, "").slice(-10)}`;
    const found = await client.query<{ id: string }>(
      `SELECT id::text FROM public.leads
       WHERE brand_id = $1::uuid
         AND (whatsapp_e164 = $2 OR whatsapp_e164 = $3 OR phone_e164 = $2 OR phone_e164 = $3)`,
      [brandId, wa, whatsapp.replace(/\D/g, "").slice(-10)]
    );
    const ids = found.rows.map((r) => r.id);
    if (ids.length === 0) return 0;
    await client.query(
      `UPDATE public.students SET source_lead_id = NULL, updated_at = now()
       WHERE source_lead_id = ANY ($1::uuid[])`,
      [ids]
    );
    const deleted = await client.query(`DELETE FROM public.leads WHERE id = ANY ($1::uuid[])`, [ids]);
    return deleted.rowCount ?? 0;
  });
}

/**
 * Prefer per-whatsapp delete when DATABASE_URL is available, then sweep all ephemeral
 * markers. No-op (non-throwing) when SQL is unavailable — leftovers need manual SQL.
 */
export async function cleanupEphemeralE2ELead(opts?: {
  brandId?: string;
  whatsapp?: string;
}): Promise<void> {
  if (!hasDatabaseUrl()) return;
  try {
    if (opts?.brandId && opts.whatsapp) {
      await hardDeleteLeadByWhatsappViaSql(opts.brandId, opts.whatsapp);
    }
    await hardDeleteEphemeralE2ELeadsViaSql();
  } catch {
    // Non-fatal: suite afterAll / manual SQL still clears leftovers.
  }
}
