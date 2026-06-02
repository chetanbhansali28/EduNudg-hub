import { describe, expect, it } from "vitest";
import { supabaseList, supabaseMaybe } from "./supabaseResult";

describe("supabaseResult", () => {
  it("returns empty list on error", () => {
    expect(supabaseList(null, { message: "fail" } as never)).toEqual([]);
  });

  it("returns data when no error", () => {
    expect(supabaseList([{ id: "1" }], null)).toEqual([{ id: "1" }]);
  });

  it("regression_supabase_maybe_null_on_error", () => {
    expect(supabaseMaybe({ id: "1" }, { message: "x" } as never)).toBeNull();
  });
});
