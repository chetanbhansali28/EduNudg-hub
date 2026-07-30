import { describe, expect, it } from "vitest";
import { supabaseList, supabaseMaybe, throwFirstSupabaseError } from "./supabaseResult";

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

  it("regression_throwFirstSupabaseError_throws_first_postgrest_error", () => {
    expect(() =>
      throwFirstSupabaseError(
        { error: null },
        { error: { message: "column does not exist", code: "42703" } as never }
      )
    ).toThrow("column does not exist");
  });

  it("regression_throwFirstSupabaseError_noop_when_all_ok", () => {
    expect(() => throwFirstSupabaseError({ error: null }, { error: null })).not.toThrow();
  });
});
