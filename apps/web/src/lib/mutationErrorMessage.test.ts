import { describe, expect, it } from "vitest";
import { mutationErrorMessage } from "./mutationErrorMessage";

describe("mutationErrorMessage", () => {
  it("regression_postgrest_error_object_is_not_generic_something_went_wrong", () => {
    expect(
      mutationErrorMessage({
        code: "42703",
        message: 'column "elem" does not exist',
        details: null,
        hint: null,
      })
    ).toBe('column "elem" does not exist');
    expect(mutationErrorMessage(new Error("Invalid curriculum"))).toBe("Invalid curriculum");
    expect(mutationErrorMessage({})).toBe("Something went wrong");
  });
});
