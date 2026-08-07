import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  isE2EEphemeralBrandName,
  isE2EEphemeralBrandSlug,
  isProtectedSeedBrandSlug,
} from "../../apps/web/src/lib/e2eEphemeralBrand";
import { hasDatabaseUrl, hasE2EBackend } from "./env";
import { platformUrl } from "./portal";
import { withSqlClient } from "./sql";
import { withE2ESupabaseUser } from "./supabaseUser";

export {
  isE2EEphemeralBrandName,
  isE2EEphemeralBrandSlug,
  isE2EEphemeralSignupEmail,
  isProtectedSeedBrandSlug,
} from "../../apps/web/src/lib/e2eEphemeralBrand";

export type PurgeEphemeralE2EResult = {
  brandsDeleted: number;
  signupsDeleted: number;
  auditLogsDeleted: number;
  brandSubscriptionsDeleted?: number;
  via: "sql" | "rpc-platform" | "ui-soft";
};

const E2E_AUDIT_PAYLOAD_PREDICATE = `(
  coalesce(payload->>'requested_name', '') ~* '^E2E Brand\\b'
  OR coalesce(payload->>'email', '') ~* '^e2e-brand-.+@example\\.com$'
  OR coalesce(payload->>'slug', '') ~* '^e2e-brand-'
)`;

function parsePurgeResult(raw: unknown): {
  brands_deleted?: number;
  signups_deleted?: number;
  audit_logs_deleted?: number;
  brand_subscriptions_deleted?: number;
} | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as {
        brands_deleted?: number;
        signups_deleted?: number;
        audit_logs_deleted?: number;
        brand_subscriptions_deleted?: number;
      };
    } catch {
      return null;
    }
  }
  return raw as {
    brands_deleted?: number;
    signups_deleted?: number;
    audit_logs_deleted?: number;
    brand_subscriptions_deleted?: number;
  };
}

/**
 * Hard-delete every brand created by E2E onboarding (name/slug patterns), including
 * already soft-archived rows, matching signup rows, brand_subscriptions (so
 * /admin/subscriptions stays clean), and platform audit log noise.
 * Never touches seeded abacusworld / smart-brain-abacus.
 */
export async function hardDeleteEphemeralE2EBrandsViaSql(): Promise<PurgeEphemeralE2EResult> {
  return withSqlClient(async (client) => {
    try {
      const rpc = await client.query<{ result: unknown }>(
        `SELECT public.purge_ephemeral_e2e_brands() AS result`
      );
      const row = parsePurgeResult(rpc.rows[0]?.result);
      if (row && typeof row.brands_deleted === "number") {
        return {
          brandsDeleted: row.brands_deleted,
          signupsDeleted: row.signups_deleted ?? 0,
          auditLogsDeleted: row.audit_logs_deleted ?? 0,
          brandSubscriptionsDeleted: row.brand_subscriptions_deleted ?? 0,
          via: "sql",
        };
      }
    } catch {
      // Function missing — use inline purge below.
    }

    const brands = await client.query<{ id: string; slug: string; name: string }>(
      `SELECT id::text, slug, name
       FROM public.brands
       WHERE slug NOT IN ('abacusworld', 'smart-brain-abacus')
         AND (
           name ~* '^E2E Brand\\b'
           OR slug ~* '^e2e-brand-'
         )`
    );

    const ids = brands.rows
      .filter(
        (row) =>
          !isProtectedSeedBrandSlug(row.slug) &&
          (isE2EEphemeralBrandName(row.name) || isE2EEphemeralBrandSlug(row.slug))
      )
      .map((row) => row.id);

    let auditLogsDeleted = 0;
    if (ids.length > 0) {
      const auditByBrand = await client.query(
        `DELETE FROM public.platform_audit_logs
         WHERE brand_id = ANY ($1::uuid[])
            OR ${E2E_AUDIT_PAYLOAD_PREDICATE}`,
        [ids]
      );
      auditLogsDeleted = auditByBrand.rowCount ?? 0;
    } else {
      const auditOnly = await client.query(
        `DELETE FROM public.platform_audit_logs WHERE ${E2E_AUDIT_PAYLOAD_PREDICATE}`
      );
      auditLogsDeleted = auditOnly.rowCount ?? 0;
    }

    let brandsDeleted = 0;
    let brandSubscriptionsDeleted = 0;
    if (ids.length > 0) {
      await client.query(
        `UPDATE public.platform_brand_signups
         SET converted_brand_id = NULL, updated_at = now()
         WHERE converted_brand_id = ANY ($1::uuid[])`,
        [ids]
      );
      const subs = await client.query(
        `DELETE FROM public.brand_subscriptions WHERE brand_id = ANY ($1::uuid[])`,
        [ids]
      );
      brandSubscriptionsDeleted = subs.rowCount ?? 0;
      await client.query(`DELETE FROM public.platform_invoices WHERE brand_id = ANY ($1::uuid[])`, [ids]);
      await client.query(`DELETE FROM public.financial_events WHERE brand_id = ANY ($1::uuid[])`, [ids]);
      await client.query(`DELETE FROM public.enrollment_history WHERE brand_id = ANY ($1::uuid[])`, [ids]);
      await client.query(`DELETE FROM public.transfer_requests WHERE brand_id = ANY ($1::uuid[])`, [ids]);
      await client.query(`DELETE FROM public.support_tickets WHERE brand_id = ANY ($1::uuid[])`, [ids]);
      const del = await client.query(`DELETE FROM public.brands WHERE id = ANY ($1::uuid[])`, [ids]);
      brandsDeleted = del.rowCount ?? 0;
    }

    const signups = await client.query(
      `DELETE FROM public.platform_brand_signups
       WHERE email ~* '^e2e-brand-.+@example\\.com$'
          OR requested_name ~* '^E2E Brand\\b'`
    );

    return {
      brandsDeleted,
      signupsDeleted: signups.rowCount ?? 0,
      auditLogsDeleted,
      brandSubscriptionsDeleted,
      via: "sql",
    };
  });
}

/** Platform-admin RPC hard-delete (works without DATABASE_URL). */
export async function hardDeleteEphemeralE2EBrandsViaRpc(): Promise<PurgeEphemeralE2EResult> {
  if (!hasE2EBackend()) {
    throw new Error("Supabase env required for RPC brand purge");
  }
  return withE2ESupabaseUser("platform", async (client) => {
    const { data, error } = await client.rpc("purge_ephemeral_e2e_brands");
    if (error) throw error;
    const row = parsePurgeResult(data);
    return {
      brandsDeleted: row?.brands_deleted ?? 0,
      signupsDeleted: row?.signups_deleted ?? 0,
      auditLogsDeleted: row?.audit_logs_deleted ?? 0,
      brandSubscriptionsDeleted: row?.brand_subscriptions_deleted ?? 0,
      via: "rpc-platform",
    };
  });
}

/**
 * Hard-delete ephemeral E2E brands (+ their brand_subscriptions). Prefers SQL,
 * then platform RPC; never soft-archives when a hard path is available.
 */
export async function hardDeleteEphemeralE2EBrands(): Promise<PurgeEphemeralE2EResult> {
  if (hasDatabaseUrl()) {
    try {
      return await hardDeleteEphemeralE2EBrandsViaSql();
    } catch {
      // Fall through to RPC.
    }
  }
  return hardDeleteEphemeralE2EBrandsViaRpc();
}

/** @deprecated Use hardDeleteEphemeralE2EBrands — soft archive left subscriptions on /admin/subscriptions. */
export async function softDeleteEphemeralE2EBrandsViaSql(): Promise<number> {
  const result = await hardDeleteEphemeralE2EBrandsViaSql();
  return result.brandsDeleted;
}

/** Reject pending E2E signup cards shown above the Brands heading (UI fallback only). */
export async function rejectEphemeralE2ESignupsViaUi(page: Page, orgName?: string): Promise<void> {
  await page.goto(platformUrl("/admin/brands"));
  await expect(page.getByRole("heading", { name: /brands/i }).first()).toBeVisible({
    timeout: 20_000,
  });

  const review = page.locator(".ed-brands-signup-review");
  if ((await review.count()) === 0) return;

  const titles: string[] = [];
  if (orgName) {
    titles.push(orgName);
  } else {
    const texts = await review.locator("button, [role='button'], .ed-pipeline-list-item").allTextContents();
    for (const text of texts) {
      const firstLine = text.split("\n")[0]?.trim() ?? "";
      if (isE2EEphemeralBrandName(firstLine)) titles.push(firstLine);
    }
  }

  for (const title of [...new Set(titles)]) {
    const item = review.getByText(title, { exact: true }).first();
    if ((await item.count()) === 0) continue;
    await item.click();
    const reject = page.getByRole("button", { name: /^Reject$/i }).first();
    if (!(await reject.isVisible().catch(() => false))) continue;
    await reject.click();
    const reason = page.getByLabel(/rejection reason/i);
    if (await reason.isVisible().catch(() => false)) {
      await reason.fill("e2e cleanup");
    }
    await page.getByRole("button", { name: /confirm reject/i }).click();
    await expect(review.getByText(title, { exact: true })).toHaveCount(0, { timeout: 20_000 }).catch(
      () => undefined
    );
  }
}

/** Archive one E2E brand from the Active Brands list (UI fallback when hard-delete unavailable). */
export async function archiveEphemeralE2EBrandViaUi(page: Page, orgName: string): Promise<void> {
  if (!isE2EEphemeralBrandName(orgName)) {
    throw new Error(`Refusing to archive non-ephemeral brand name: ${orgName}`);
  }

  await page.goto(platformUrl("/admin/brands"));
  await expect(page.getByRole("heading", { name: /brands/i }).first()).toBeVisible({
    timeout: 20_000,
  });

  const search = page.getByPlaceholder("Search brands…");
  if (await search.isVisible().catch(() => false)) {
    await search.fill(orgName);
  }

  const row = page.locator("article.ed-directory-brand-row").filter({ hasText: orgName }).first();
  if ((await row.count()) === 0) {
    return;
  }

  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /archive this brand/i })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByLabel(/type confirm to proceed/i).fill("CONFIRM");
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator("article.ed-directory-brand-row").filter({ hasText: orgName })).toHaveCount(
    0,
    { timeout: 20_000 }
  );
}

/**
 * Prefer hard-delete (SQL or platform RPC) so brand_subscriptions are removed from
 * /admin/subscriptions. UI soft-archive is last resort only.
 */
export async function cleanupEphemeralE2EBrand(opts: {
  page: Page;
  orgName: string;
}): Promise<void> {
  const { page, orgName } = opts;
  try {
    await hardDeleteEphemeralE2EBrands();
    return;
  } catch (err) {
    console.warn("[brandCleanup] hard-delete failed, falling back to UI soft-archive:", err);
  }
  await rejectEphemeralE2ESignupsViaUi(page, orgName);
  await archiveEphemeralE2EBrandViaUi(page, orgName);
}
