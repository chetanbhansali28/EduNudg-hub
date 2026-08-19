import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("list_center_active_merchandise_catalog SQL", () => {
  it("regression_list_center_active_catalog_rpc_returns_bigint_price_cents", () => {
    const sql = readFileSync(
      resolve(__dirname, "../../../../supabase/migrations/088_list_center_merchandise_catalog_price_bigint.sql"),
      "utf8"
    );
    expect(sql).toMatch(/price_cents bigint/);
    expect(sql).not.toMatch(/price_cents integer/);
  });
});
