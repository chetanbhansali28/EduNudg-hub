import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ac-modal responsive layout", () => {
  const css = readFileSync(resolve(__dirname, "../marketing.css"), "utf8");

  it("regression_lead_modal_viewport_capped_with_scrollable_body", () => {
    expect(css).toMatch(/\.ac-modal\s*\{[^}]*max-height:\s*calc\(100dvh/s);
    expect(css).toMatch(/\.ac-modal__panel\s*\{[^}]*max-height:\s*calc\(100dvh/s);
    expect(css).toMatch(/\.ac-modal__body\s*\{[^}]*overflow-y:\s*auto/s);
    expect(css).not.toMatch(/\.ac-modal\s*\{[^}]*max-height:\s*none/s);
  });

  it("regression_lead_modal_desktop_two_column_mobile_full_width", () => {
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.ac-modal\s*\{[^}]*100vw/s);
    expect(css).toMatch(
      /@media \(min-width: 768px\)[\s\S]*?\.ac-modal__grid\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s
    );
  });
});
