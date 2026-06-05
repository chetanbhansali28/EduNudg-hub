import { describe, expect, it } from "vitest";
import { formatInrFromPaise, paiseToRupeesInput, rupeesToPaise } from "./inrCurrency";

describe("inrCurrency", () => {
  it("formats INR with two decimal places", () => {
    expect(formatInrFromPaise(999900)).toMatch(/9,999\.00/);
    expect(formatInrFromPaise(100)).toMatch(/1\.00/);
  });

  it("converts rupees and paise", () => {
    expect(rupeesToPaise("9999")).toBe(999900);
    expect(rupeesToPaise("99.50")).toBe(9950);
    expect(paiseToRupeesInput(2499900)).toBe("24999.00");
  });
});
