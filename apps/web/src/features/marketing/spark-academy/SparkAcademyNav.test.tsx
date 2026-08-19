import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { exactAccessibleName } from "@/test/exactAccessibleName";
import { SparkAcademyNav } from "./SparkAcademyNav";

describe("SparkAcademyNav", () => {
  it("regression_spark_nav_omits_hardcoded_login_on_brand_site", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.links = config.nav.links.filter((link) => !/login/i.test(link.label) && link.href !== "/login");

    render(
      <MemoryRouter>
        <SparkAcademyNav config={config} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: exactAccessibleName("Login") })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    expect(within(drawer).queryByRole("link", { name: exactAccessibleName("Login") })).toBeNull();
    expect(within(drawer).queryByRole("link", { name: exactAccessibleName("Student Login") })).toBeNull();
  });

  it("regression_brand_spark_nav_logo_is_franchise_size", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.meta.logoUrl = "https://cdn.example.com/brand-assets/logo.png";

    const { container } = render(
      <MemoryRouter>
        <SparkAcademyNav config={config} />
      </MemoryRouter>
    );

    expect(container.querySelector(".sa-nav--franchise")).toBeNull();
    const logo = container.querySelector(".sa-nav__logo-img") as HTMLImageElement;
    expect(logo?.getAttribute("width")).toBe("64");
    expect(logo?.getAttribute("height")).toBe("64");
  });

  it("regression_spark_nav_login_comes_from_navigation_ctas", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.links = [...config.nav.links, { label: "Login", href: "/login" }];

    render(
      <MemoryRouter>
        <SparkAcademyNav config={config} />
      </MemoryRouter>
    );

    const headerLogin = screen.getByRole("link", { name: exactAccessibleName("Login") });
    expect(headerLogin.getAttribute("href")).toBe("/login");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    const drawerLogin = within(drawer).getByRole("link", { name: exactAccessibleName("Login") });
    expect(drawerLogin.getAttribute("href")).toBe("/login");
  });

  it("regression_spark_nav_about_comes_from_navigation_ctas", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.links = config.nav.links.filter((link) => link.href !== "/about" && link.href !== "#about");
    config.nav.links = [...config.nav.links, { label: "Our story", href: "/about" }];

    render(
      <MemoryRouter>
        <SparkAcademyNav config={config} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: exactAccessibleName("Our story") }).getAttribute("href")).toBe("/about");
    expect(screen.queryByRole("link", { name: exactAccessibleName("About Us") })).toBeNull();
  });

  it("regression_spark_nav_shows_secondary_cta_from_navigation", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.secondaryCtaLabel = "Own a center";
    config.nav.secondaryCtaHref = "apply";

    render(
      <MemoryRouter>
        <LeadModalProvider>
          <SparkAcademyNav config={config} />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByRole("button", { name: exactAccessibleName("Own a center") }).length).toBeGreaterThan(0);
    expect(document.querySelector(".sa-nav__actions .sa-nav__cta--header")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    expect(drawer.classList.contains("marketing-page--spark-academy")).toBe(true);
    expect(within(drawer).getByRole("button", { name: exactAccessibleName("Own a center") })).toBeDefined();
    expect(within(drawer).getByRole("button", { name: exactAccessibleName("Get started") })).toBeDefined();
    expect(within(drawer).queryByRole("button", { name: exactAccessibleName("Own a center") })?.closest(".sa-nav__drawer-ctas")).toBeDefined();
  });

  it("regression_spark_mobile_secondary_cta_header_uses_drawer_only_class", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.secondaryCtaLabel = "Own a center";
    config.nav.secondaryCtaHref = "apply";

    render(
      <MemoryRouter>
        <LeadModalProvider>
          <SparkAcademyNav config={config} />
        </LeadModalProvider>
      </MemoryRouter>
    );

    const headerCta = document.querySelector(".sa-nav__actions .sa-nav__cta--header");
    expect(headerCta).toBeDefined();
    expect(headerCta?.textContent).toContain("Own a center");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawerCta = within(screen.getByRole("dialog", { name: "Site menu" })).getByRole("button", {
      name: exactAccessibleName("Own a center"),
    });
    expect(drawerCta.classList.contains("sa-nav__cta--header")).toBe(false);
  });

  it("regression_spark_nav_drawer_css_uses_theme_tokens_and_hides_header_secondary", () => {
    const css = readFileSync(resolve(__dirname, "spark-academy.css"), "utf8");
    expect(css).toMatch(/\.marketing-page--spark-academy,\s*\.sa-nav__drawer,\s*\.ac-modal--spark\s*\{/);
    expect(css).toMatch(/\.sa-nav__drawer\s*\{[\s\S]*?font-family:\s*var\(--sa-heading-font\)/);
    expect(css).toMatch(/\.sa-nav__drawer-title\s*\{[\s\S]*?color:\s*var\(--sa-navy\)/);
    expect(css).toMatch(
      /@media \(max-width: 1023px\) \{[\s\S]*?\.sa-nav__actions \.sa-nav__cta--header \{\s*display:\s*none;/
    );
  });

  it("regression_spark_nav_omits_secondary_cta_on_franchise", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.secondaryCtaLabel = "Own a center";
    config.nav.secondaryCtaHref = "apply";

    render(
      <MemoryRouter>
        <LeadModalProvider>
          <SparkAcademyNav config={config} brandSlug="smart-brain-abacus" />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: exactAccessibleName("Own a center") })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    expect(within(drawer).queryByRole("button", { name: exactAccessibleName("Own a center") })).toBeNull();
  });

  it("regression_spark_drawer_uses_student_login_on_franchise", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.nav.links = config.nav.links.filter((link) => !/login/i.test(link.label) && link.href !== "/login");

    render(
      <MemoryRouter>
        <SparkAcademyNav config={config} brandSlug="smart-brain-abacus" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    expect(within(drawer).getByRole("link", { name: exactAccessibleName("Student Login") })).toBeDefined();
    expect(within(drawer).queryByRole("link", { name: exactAccessibleName("Login") })).toBeNull();
  });

  it("regression_spark_drawer_shows_logo_before_brand_name", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.meta.logoUrl = "https://cdn.example.com/brand-assets/logo.png";

    render(
      <MemoryRouter>
        <SparkAcademyNav config={config} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    const brand = drawer.querySelector(".sa-nav__drawer-brand");
    expect(brand).toBeDefined();
    const logo = brand?.querySelector("img.sa-nav__logo-img");
    expect(logo?.getAttribute("src")).toBe("https://cdn.example.com/brand-assets/logo.png");
    expect(brand?.firstElementChild).toBe(logo);
    expect(within(drawer).getByText("Smart Brain Abacus")).toBeDefined();
    expect(logo?.nextElementSibling?.classList.contains("sa-nav__drawer-title")).toBe(true);
  });
});
