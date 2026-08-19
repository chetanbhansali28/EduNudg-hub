import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("list_center_active_merchandise_catalog SQL", () => {
  it("regression_list_center_active_catalog_rpc_returns_setof_catalog", () => {
    const sql = readFileSync(
      resolve(__dirname, "../../../../supabase/migrations/089_list_center_merchandise_catalog_setof.sql"),
      "utf8"
    );
    expect(sql).toMatch(/RETURNS SETOF public\.merchandise_catalog/);
    expect(sql).toMatch(/LANGUAGE sql/);
  });
});
