import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { EnterpriseSiteFooter } from "./EnterpriseSiteFooter";
import { EnterprisePreFooterCta } from "./EnterprisePreFooterCta";

function renderFooter(config = DEFAULT_HOMEPAGE_CONFIG) {
  return render(
    <MemoryRouter>
      <EnterpriseSiteFooter config={config} />
    </MemoryRouter>
  );
}

describe("EnterpriseSiteFooter", () => {
  it("regression_platform_footer_links_render_from_config", () => {
    renderFooter();
    expect(screen.getByRole("heading", { name: "Product" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Company" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Connect" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Legal" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Features" }).getAttribute("href")).toBe("#features");
    expect(screen.getByRole("link", { name: "Contact" }).getAttribute("href")).toBe(
      "mailto:support@edunudg.com"
    );
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/legal/privacy");
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/legal/terms");
    expect(screen.getByText(DEFAULT_HOMEPAGE_CONFIG.footer.copyright)).toBeDefined();
    expect(screen.queryByText("Privacy Policy")).toBeNull();
    expect(screen.queryByText("Platform admin")).toBeNull();
    expect(screen.queryByText("Edit homepage")).toBeNull();
  });

  it("regression_platform_footer_omits_admin_links", () => {
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      footer: {
        ...DEFAULT_HOMEPAGE_CONFIG.footer,
        companyLinks: [
          { label: "Platform admin", href: "/admin" },
          { label: "Edit homepage", href: "/admin/homepage" },
          { label: "Contact", href: "mailto:support@edunudg.com" },
        ],
      },
    };
    renderFooter(config);
    expect(screen.queryByText("Platform admin")).toBeNull();
    expect(screen.queryByText("Edit homepage")).toBeNull();
    expect(screen.getByRole("link", { name: "Contact" })).toBeDefined();
  });
});

describe("EnterprisePreFooterCta", () => {
  it("regression_prefooter_uses_footer_cta_not_hero", () => {
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      footerCta: {
        ...DEFAULT_HOMEPAGE_CONFIG.footerCta,
        ctaLabel: "Pre-footer only CTA",
        ctaHref: "/legal/terms",
      },
      hero: {
        ...DEFAULT_HOMEPAGE_CONFIG.hero,
        ctaLabel: "Hero CTA",
        ctaHref: "#brand-signup",
      },
    };
    render(
      <MemoryRouter>
        <EnterprisePreFooterCta config={config} />
      </MemoryRouter>
    );
    const cta = screen.getByRole("link", { name: "Pre-footer only CTA" });
    expect(cta.getAttribute("href")).toBe("/legal/terms");
    expect(screen.queryByText("Hero CTA")).toBeNull();
  });
});
