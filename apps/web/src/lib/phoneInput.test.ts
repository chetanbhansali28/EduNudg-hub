import { describe, expect, it } from "vitest";
import { PHONE_INPUT_PLACEHOLDER } from "./phoneInput";

describe("phoneInput", () => {
  it("regression_placeholder_is_local_number_without_country_prefix", () => {
    expect(PHONE_INPUT_PLACEHOLDER).toBe("9890200000");
    expect(PHONE_INPUT_PLACEHOLDER.startsWith("+")).toBe(false);
  });
});
