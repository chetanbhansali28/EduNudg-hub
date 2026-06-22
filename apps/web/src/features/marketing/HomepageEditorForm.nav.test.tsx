import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { AbacusClassicEditorForm } from "./AbacusClassicEditorForm";
import { HomepageEditorForm } from "./HomepageEditorForm";

describe("HomepageEditorForm navigation", () => {
  it("regression_can_add_and_edit_nav_menu_items", () => {
    let config = { ...DEFAULT_HOMEPAGE_CONFIG };
    const onChange = vi.fn((next: typeof config) => {
      config = next;
    });

    render(<HomepageEditorForm config={config} onChange={onChange} />);

    expect(screen.getByRole("heading", { name: "Navigation Management" })).toBeDefined();
    expect(screen.getAllByLabelText("Label").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: /Add menu item/i }));
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall!.nav.links.length).toBe(DEFAULT_HOMEPAGE_CONFIG.nav.links.length + 1);
  });

  it("regression_shows_theme_nav_link_dropdown_for_brand_novu", () => {
    render(
      <HomepageEditorForm
        config={DEFAULT_HOMEPAGE_CONFIG}
        onChange={() => undefined}
        portalMode="brand"
      />
    );

    const linkSelect = screen.getAllByLabelText("Link")[0] as HTMLSelectElement;
    const optionLabels = Array.from(linkSelect.options).map((o) => o.textContent);
    expect(optionLabels.some((label) => label?.includes("#apply"))).toBe(true);
    expect(optionLabels.some((label) => label?.includes("#register"))).toBe(false);
  });

  it("regression_custom_nav_link_shows_text_input", () => {
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      nav: {
        ...DEFAULT_HOMEPAGE_CONFIG.nav,
        links: [{ label: "Login", href: "/login" }],
      },
    };

    render(<HomepageEditorForm config={config} onChange={() => undefined} portalMode="brand" />);

    expect(screen.getByLabelText("Custom link")).toBeDefined();
    expect((screen.getByLabelText("Link") as HTMLSelectElement).value).toBe("__custom__");
  });
});

describe("AbacusClassicEditorForm navigation", () => {
  it("regression_nav_link_dropdown_lists_founders_anchor", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain");
    render(
      <AbacusClassicEditorForm
        config={config}
        marketingTheme="abacus-classic"
        portalMode="brand"
        onChange={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Navigation & CTAs/i }));

    const navPanel = screen.getByText("Menu item 1").closest(".ed-editor-item-panel") as HTMLElement;
    expect(navPanel).toBeDefined();
    const linkSelect = within(navPanel).getByLabelText("Link") as HTMLSelectElement;
    expect(Array.from(linkSelect.options).some((o) => o.value === "#founders")).toBe(true);
  });
});
