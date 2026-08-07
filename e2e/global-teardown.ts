/**
 * Playwright global teardown: sweep ephemeral E2E brands (and their subscriptions)
 * plus student leads left by any suite.
 */
import { hardDeleteEphemeralE2EBrands } from "./helpers/brandCleanup";
import { hardDeleteEphemeralE2ELeads } from "./helpers/leadCleanup";
import { hasDatabaseUrl, hasE2EBackend } from "./helpers/env";
import { SEED } from "./helpers/portal";

async function globalTeardown() {
  if (!hasE2EBackend() && !hasDatabaseUrl()) return;

  try {
    const brands = await hardDeleteEphemeralE2EBrands();
    console.log(
      `[e2e teardown] purged ephemeral brands via ${brands.via}: ` +
        `${brands.brandsDeleted} brands, ${brands.brandSubscriptionsDeleted ?? 0} subscriptions, ` +
        `${brands.signupsDeleted} signups`
    );
  } catch (err) {
    console.warn("[e2e teardown] ephemeral brand purge failed:", err);
  }

  try {
    const result = await hardDeleteEphemeralE2ELeads({ brandId: SEED.brandId });
    console.log(
      `[e2e teardown] purged ephemeral leads via ${result.via}: ` +
        `${result.leadsDeleted} leads, ${result.studentsUnlinked} unlinked` +
        (result.studentsDeleted ? `, ${result.studentsDeleted} students` : "")
    );
  } catch (err) {
    console.warn("[e2e teardown] ephemeral lead purge failed:", err);
  }
}

export default globalTeardown;
