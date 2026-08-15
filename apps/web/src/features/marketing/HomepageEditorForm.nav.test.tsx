import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { mergeAbacusClassicLandingConfig, mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
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

    const navHeading = screen.getByRole("heading", { name: "Navigation Management" });
    const navCard = navHeading.closest(".ed-editor-section-card");
    expect(navCard).not.toBeNull();
    expect(within(navCard as HTMLElement).getByLabelText("Custom link")).toBeDefined();
    expect((within(navCard as HTMLElement).getByLabelText("Link") as HTMLSelectElement).value).toBe(
      "__custom__"
    );
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
    expect(Array.from(linkSelect.options).some((o) => o.value === "/about")).toBe(true);
    // #about appears only when sections.about is enabled (default off)
    expect(Array.from(linkSelect.options).some((o) => o.value === "#about")).toBe(false);
  });

  it("regression_nav_link_dropdown_lists_about_section_when_enabled", () => {
    let config = mergeAbacusClassicLandingConfig("Smart Brain");
    config = {
      ...config,
      sections: { ...config.sections, about: true },
    };
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
    const linkSelect = within(navPanel).getByLabelText("Link") as HTMLSelectElement;
    expect(Array.from(linkSelect.options).some((o) => o.value === "#about")).toBe(true);
  });

  it("regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain");
    render(
      <AbacusClassicEditorForm
        config={config}
        marketingTheme="spark-academy"
        portalMode="brand"
        onChange={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Navigation & CTAs/i }));

    const navPanel = screen.getByText("Menu item 1").closest(".ed-editor-item-panel") as HTMLElement;
    const linkSelect = within(navPanel).getByLabelText("Link") as HTMLSelectElement;
    const labels = Array.from(linkSelect.options).map((o) => o.textContent);
    const values = Array.from(linkSelect.options).map((o) => o.value);

    expect(labels).not.toContain("Programs (#programs)");
    expect(labels).not.toContain("About us (#features)");
    expect(values).not.toContain("#curriculum");
    expect(values).toContain("#programs");
    expect(values).toContain("#features");
    expect(values).toContain("/about");
    expect(values).toContain("#gallery");
    expect(labels).toContain("Courses (#programs)");
    expect(labels).toContain("Features (#features)");
    expect(labels).toContain("Photo gallery (#gallery)");
  });
});
