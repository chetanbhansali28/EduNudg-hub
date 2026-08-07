/**
 * Playwright global teardown: sweep ephemeral E2E student leads left by any suite.
 * Uses SQL when DATABASE_URL is set; otherwise platform/brand RPC (anon + seed login).
 */
import {
  hardDeleteEphemeralE2ELeads,
} from "./helpers/leadCleanup";
import { hasDatabaseUrl, hasE2EBackend } from "./helpers/env";
import { SEED } from "./helpers/portal";

async function globalTeardown() {
  if (!hasE2EBackend() && !hasDatabaseUrl()) return;
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
