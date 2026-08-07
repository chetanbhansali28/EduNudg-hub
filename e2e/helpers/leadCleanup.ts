import { E2E_EPHEMERAL_LEAD_SQL_PREDICATE } from "../../apps/web/src/lib/e2eEphemeralLead";
import { uniqueWhatsApp } from "./auth";
import { hasDatabaseUrl, hasE2EBackend } from "./env";
import { withSqlClient } from "./sql";
import { withE2ESupabaseUser } from "./supabaseUser";

export {
  isE2EEphemeralLead,
  isE2EEphemeralLeadChildName,
  isE2EEphemeralLeadEmail,
  isE2EEphemeralLeadFullName,
  isE2EEphemeralLeadParentName,
} from "../../apps/web/src/lib/e2eEphemeralLead";

export type PurgeEphemeralE2ELeadsResult = {
  leadsDeleted: number;
  studentsUnlinked: number;
  studentsDeleted?: number;
  via: "sql" | "rpc-platform" | "rpc-brand";
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
 * Canonical markers for student-lead E2E so SQL/RPC purge can hard-delete leftovers.
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

function parsePurgeResult(raw: unknown): {
  leads_deleted?: number;
  students_unlinked?: number;
  students_deleted?: number;
} | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as {
        leads_deleted?: number;
        students_unlinked?: number;
        students_deleted?: number;
      };
    } catch {
      return null;
    }
  }
  return raw as {
    leads_deleted?: number;
    students_unlinked?: number;
    students_deleted?: number;
  };
}

/** Direct Postgres hard-delete (requires DATABASE_URL / SUPABASE_DB_PASSWORD). */
export async function hardDeleteEphemeralE2ELeadsViaSql(): Promise<PurgeEphemeralE2ELeadsResult> {
  return withSqlClient(async (client) => {
    try {
      const rpc = await client.query<{ result: unknown }>(
        `SELECT public.purge_ephemeral_e2e_leads() AS result`
      );
      const row = parsePurgeResult(rpc.rows[0]?.result);
      if (row && typeof row.leads_deleted === "number") {
        return {
          leadsDeleted: row.leads_deleted,
          studentsUnlinked: row.students_unlinked ?? 0,
          studentsDeleted: row.students_deleted ?? 0,
          via: "sql",
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
      return { leadsDeleted: 0, studentsUnlinked: 0, studentsDeleted: 0, via: "sql" };
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
      studentsDeleted: 0,
      via: "sql",
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
 * Call purge RPCs via anon key + seed user session (works without DATABASE_URL).
 * Platform admin sweeps all brands; brand owner can sweep a single brand.
 */
export async function hardDeleteEphemeralE2ELeadsViaRpc(opts?: {
  brandId?: string;
}): Promise<PurgeEphemeralE2ELeadsResult> {
  if (!hasE2EBackend()) {
    throw new Error("Supabase env required for RPC lead purge");
  }

  try {
    return await withE2ESupabaseUser("platform", async (client) => {
      const { data, error } = await client.rpc("purge_ephemeral_e2e_leads");
      if (error) throw error;
      const row = parsePurgeResult(data);
      return {
        leadsDeleted: row?.leads_deleted ?? 0,
        studentsUnlinked: row?.students_unlinked ?? 0,
        studentsDeleted: row?.students_deleted ?? 0,
        via: "rpc-platform" as const,
      };
    });
  } catch (platformErr) {
    if (!opts?.brandId) throw platformErr;
    return withE2ESupabaseUser("brand", async (client) => {
      const { data, error } = await client.rpc("purge_ephemeral_e2e_leads_for_brand", {
        p_brand_id: opts.brandId,
      });
      if (error) throw error;
      const row = parsePurgeResult(data);
      return {
        leadsDeleted: row?.leads_deleted ?? 0,
        studentsUnlinked: row?.students_unlinked ?? 0,
        studentsDeleted: 0,
        via: "rpc-brand" as const,
      };
    });
  }
}

/**
 * Hard-delete ephemeral E2E leads. Prefers SQL when DATABASE_URL is set; otherwise
 * uses platform (then brand) RPC so CI without DB password still cleans `/app/leads`.
 */
export async function hardDeleteEphemeralE2ELeads(opts?: {
  brandId?: string;
}): Promise<PurgeEphemeralE2ELeadsResult> {
  if (hasDatabaseUrl()) {
    try {
      return await hardDeleteEphemeralE2ELeadsViaSql();
    } catch {
      // Fall through to RPC.
    }
  }
  return hardDeleteEphemeralE2ELeadsViaRpc(opts);
}

/**
 * Per-test cleanup: delete by WhatsApp when SQL available, then full ephemeral sweep.
 * Never silently no-ops when Supabase anon env is present — uses RPC instead.
 */
export async function cleanupEphemeralE2ELead(opts?: {
  brandId?: string;
  whatsapp?: string;
}): Promise<void> {
  if (hasDatabaseUrl() && opts?.brandId && opts.whatsapp) {
    try {
      await hardDeleteLeadByWhatsappViaSql(opts.brandId, opts.whatsapp);
    } catch {
      // Continue to full sweep.
    }
  }
  try {
    await hardDeleteEphemeralE2ELeads({ brandId: opts?.brandId });
  } catch (err) {
    console.warn("[leadCleanup] ephemeral lead purge failed:", err);
  }
}
