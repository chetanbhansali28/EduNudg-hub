import { describe, expect, it } from "vitest";
import {
  buildCanonicalUrl,
  classifyPublicPath,
  derivePublicSeo,
  preferredPublicOrigin,
} from "./publicSeo";
import { buildSitemapXml, sitemapPathsForPortal } from "./publicSeoDiscovery";
import { injectPublicSeoHead, PUBLIC_SEO_HEAD_MARK } from "./publicSeoHtml";

const BRAND_ASSET = "https://xyz.supabase.co/storage/v1/object/public/brand-assets/logo.png";

function brandHome(overrides: Partial<Parameters<typeof derivePublicSeo>[0]> = {}) {
  return derivePublicSeo({
    portal: "brand",
    pathname: "/",
    requestOrigin: "https://digitley-pune.example.com",
    portalBaseDomain: "example.com",
    brandSlug: "digitley-pune",
    siteName: "Digitley",
    heroLine: "Give your child an edge",
    heroSubtitle: "Structured programs with certified instructors across Pune.",
    logoUrl: BRAND_ASSET,
    ...overrides,
  });
}

describe("publicSeo", () => {
  it("regression_public_seo_derives_title_description_canonical", () => {
    const seo = brandHome();
    expect(seo.title).toBe("Give your child an edge | Digitley");
    expect(seo.description).toContain("Structured programs");
    expect(seo.canonicalUrl).toBe("https://digitley-pune.example.com/");
    expect(seo.robots).toBe("index, follow");
    expect(seo.ogImageUrl).toBe(BRAND_ASSET);
  });

  it("regression_center_seo_localizes_city_and_does_not_canonicalize_to_brand", () => {
    const seo = derivePublicSeo({
      portal: "center",
      pathname: "/",
      requestOrigin: "https://rathi-educom.digitley-pune.example.com",
      portalBaseDomain: "example.com",
      brandSlug: "digitley-pune",
      centerSlug: "rathi-educom",
      siteName: "Digitley",
      brandName: "Digitley",
      heroSubtitle: "Brand-wide subtitle that should not leak as the only differentiator.",
      center: { name: "Rathi Educom", city: "Pune", addressLine1: "FC Road", phone: "+91 2000000000" },
    });
    expect(seo.title).toContain("Digitley in Pune");
    expect(seo.canonicalUrl).toBe("https://rathi-educom.digitley-pune.example.com/");
    expect(seo.canonicalUrl).not.toBe("https://digitley-pune.example.com/");
    expect(seo.jsonLd.some((node) => node["@type"] === "EducationalOrganization")).toBe(true);
  });

  it("regression_private_and_preview_routes_are_noindex", () => {
    const login = derivePublicSeo({
      portal: "brand",
      pathname: "/login",
      requestOrigin: "https://digitley-pune.example.com",
      brandSlug: "digitley-pune",
      siteName: "Digitley",
    });
    expect(login.robots).toBe("noindex, nofollow");
    expect(login.indexable).toBe(false);

    const app = derivePublicSeo({
      portal: "brand",
      pathname: "/app/homepage",
      requestOrigin: "https://digitley-pune.example.com",
      brandSlug: "digitley-pune",
      siteName: "Digitley",
    });
    expect(app.pageKind).toBe("private");
    expect(app.robots).toBe("noindex, nofollow");

    const preview = brandHome({ isPreview: true });
    expect(preview.robots).toBe("noindex, nofollow");
  });

  it("regression_course_page_emits_course_json_ld", () => {
    const seo = derivePublicSeo({
      portal: "brand",
      pathname: "/courses/junior-abacus",
      requestOrigin: "https://digitley-pune.example.com",
      portalBaseDomain: "example.com",
      brandSlug: "digitley-pune",
      siteName: "Digitley",
      course: { name: "Junior Abacus", description: "Foundations for ages 4–7", ageLabel: "4–7" },
    });
    expect(seo.title).toBe("Junior Abacus | Digitley");
    const course = seo.jsonLd.find((node) => node["@type"] === "Course");
    expect(course?.name).toBe("Junior Abacus");
    expect(seo.jsonLd.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
  });

  it("regression_faq_json_ld_omitted_when_no_public_faqs", () => {
    const empty = brandHome({ faq: [], faqVisible: true });
    expect(empty.jsonLd.some((node) => node["@type"] === "FAQPage")).toBe(false);

    const hidden = brandHome({
      faq: [{ question: "What age?", answer: "4–14" }],
      faqVisible: false,
    });
    expect(hidden.jsonLd.some((node) => node["@type"] === "FAQPage")).toBe(false);

    const shown = brandHome({
      faq: [{ question: "What age?", answer: "4–14" }],
      faqVisible: true,
    });
    expect(shown.jsonLd.some((node) => node["@type"] === "FAQPage")).toBe(true);
  });

  it("canonicalizes vercel query URLs to the brand host when a base domain exists", () => {
    expect(
      preferredPublicOrigin({
        portal: "brand",
        requestOrigin: "https://edunudg-hub.vercel.app",
        portalBaseDomain: "example.com",
        brandSlug: "digitley-pune",
      })
    ).toBe("https://digitley-pune.example.com");
    expect(
      buildCanonicalUrl({
        portal: "brand",
        pathname: "/",
        requestOrigin: "https://edunudg-hub.vercel.app",
        requestSearch: "?portal=brand&brand=digitley-pune",
        portalBaseDomain: "example.com",
        brandSlug: "digitley-pune",
        siteName: "Digitley",
      })
    ).toBe("https://digitley-pune.example.com/");
  });

  it("does not treat applyCanonicalSiteName-style siteName as a URL", () => {
    const seo = brandHome({ siteName: "Digitley" });
    expect(seo.canonicalUrl.startsWith("http")).toBe(true);
    expect(seo.canonicalUrl).not.toContain("Digitley");
  });

  it("classifies public paths", () => {
    expect(classifyPublicPath("/about", "brand")).toBe("about");
    expect(classifyPublicPath("/about", "center")).toBe("other");
    expect(classifyPublicPath("/courses/junior-abacus", "center")).toBe("course");
    expect(classifyPublicPath("/auth/handoff", "platform")).toBe("private");
  });
});

describe("publicSeoDiscovery", () => {
  it("regression_sitemap_lists_published_courses_not_login", () => {
    const xml = buildSitemapXml({
      portal: "brand",
      pathname: "/",
      requestOrigin: "https://digitley-pune.example.com",
      portalBaseDomain: "example.com",
      brandSlug: "digitley-pune",
      siteName: "Digitley",
      aboutPublished: true,
      coursePaths: ["/courses/junior-abacus"],
      publishedLegalKinds: ["privacy"],
    });
    expect(xml).toContain("https://digitley-pune.example.com/");
    expect(xml).toContain("https://digitley-pune.example.com/courses/junior-abacus");
    expect(xml).toContain("https://digitley-pune.example.com/legal/privacy");
    expect(xml).not.toContain("/login");
  });

  it("regression_sitemap_omits_hash_sections_and_unpublished_about", () => {
    const paths = sitemapPathsForPortal({
      portal: "brand",
      pathname: "/",
      requestOrigin: "https://digitley-pune.example.com",
      brandSlug: "digitley-pune",
      siteName: "Digitley",
      aboutPublished: false,
      coursePaths: ["/courses/junior-abacus", "/#programs", "/shop"],
    });
    expect(paths).toContain("/");
    expect(paths).toContain("/courses/junior-abacus");
    expect(paths).not.toContain("/about");
    expect(paths).not.toContain("/#programs");
    expect(paths).not.toContain("/shop");

    const xml = buildSitemapXml({
      portal: "brand",
      pathname: "/",
      requestOrigin: "https://digitley-pune.example.com",
      brandSlug: "digitley-pune",
      siteName: "Digitley",
      aboutPublished: false,
      coursePaths: ["/courses/junior-abacus"],
    });
    expect(xml).not.toContain("/about");
    expect(xml).not.toContain("#programs");
  });
});

describe("publicSeoHtml", () => {
  it("injects derived head at the marker", () => {
    const seo = brandHome();
    const html = injectPublicSeoHead(
      `<html><head><title>EduNudg</title>${PUBLIC_SEO_HEAD_MARK}</head><body></body></html>`,
      seo
    );
    expect(html).toContain("<title>Give your child an edge | Digitley</title>");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("application/ld+json");
    expect(html).not.toContain(PUBLIC_SEO_HEAD_MARK);
  });
});
