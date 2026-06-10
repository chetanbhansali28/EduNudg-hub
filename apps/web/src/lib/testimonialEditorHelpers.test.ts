import { describe, expect, it } from "vitest";
import {
  formatTestimonialQuoteCount,
  moveItem,
  testimonialQuoteLengthHint,
  TESTIMONIAL_QUOTE_MAX,
  TESTIMONIAL_QUOTE_MIN,
} from "./testimonialEditorHelpers";

describe("testimonialEditorHelpers", () => {
  it("regression_quote_length_hints", () => {
    expect(testimonialQuoteLengthHint(0)).toBe("ok");
    expect(testimonialQuoteLengthHint(TESTIMONIAL_QUOTE_MIN - 1)).toBe("short");
    expect(testimonialQuoteLengthHint(TESTIMONIAL_QUOTE_MIN)).toBe("ok");
    expect(testimonialQuoteLengthHint(TESTIMONIAL_QUOTE_MAX)).toBe("ok");
    expect(testimonialQuoteLengthHint(TESTIMONIAL_QUOTE_MAX + 1)).toBe("long");
  });

  it("regression_format_quote_count", () => {
    expect(formatTestimonialQuoteCount(42)).toContain("42 / 100");
    expect(formatTestimonialQuoteCount(42)).toContain("50–100");
  });

  it("regression_move_item_reorders", () => {
    const items = ["a", "b", "c"];
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(items, 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(items, 1, 1)).toEqual(items);
    expect(moveItem(items, -1, 0)).toEqual(items);
  });
});
