import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("sync_merchandise_catalog_programs SQL", () => {
  it("regression_sync_merchandise_catalog_programs_reads_jsonb_array_value_column", () => {
    const sql = readFileSync(
      resolve(__dirname, "../../../../supabase/migrations/087_fix_sync_merchandise_catalog_programs.sql"),
      "utf8"
    );
    expect(sql).toMatch(/FOR v_link IN SELECT value FROM jsonb_array_elements/);
    expect(sql).not.toMatch(/SELECT elem\s+FROM jsonb_array_elements/);
  });
});
