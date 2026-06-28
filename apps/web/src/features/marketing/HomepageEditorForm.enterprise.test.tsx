import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";

vi.mock("./MarketingMediaField", () => ({
  MarketingMediaField: () => null,
}));

describe("HomepageEditorForm enterprise", () => {
  it("regression_platform_hides_novu_phone_scroll_and_highlights", () => {
    render(
      <HomepageEditorForm
        config={DEFAULT_HOMEPAGE_CONFIG}
        onChange={() => undefined}
        portalMode="platform"
      />
    );
    expect(screen.queryByText("Feature sections (phone blocks)")).toBeNull();
    expect(screen.queryByText("Highlight cards (horizontal scroller)")).toBeNull();
    expect(screen.getByText("Connectivity showcase")).toBeDefined();
    expect(screen.getByText("Feature grid")).toBeDefined();
    expect(screen.getByText("Brand signup")).toBeDefined();
  });

  it("regression_homepage_editor_edits_footer_product_links", () => {
    const onChange = vi.fn();
    render(
      <HomepageEditorForm
        config={DEFAULT_HOMEPAGE_CONFIG}
        onChange={onChange}
        portalMode="platform"
      />
    );

    expect(screen.getByText("Product links 1")).toBeDefined();
    expect(screen.getByText("Legal — Privacy link")).toBeDefined();
    expect(screen.getByText("Pre-footer CTA button label")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "+ Add product link" }));

    expect(onChange).toHaveBeenCalled();
    const nextConfig = onChange.mock.calls.at(-1)?.[0];
    expect(nextConfig.footer.productLinks).toHaveLength(
      DEFAULT_HOMEPAGE_CONFIG.footer.productLinks.length + 1
    );
  });
});
