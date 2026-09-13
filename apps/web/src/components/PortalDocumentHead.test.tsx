import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortalDocumentHead } from "./PortalDocumentHead";
import { applyPublicSeoSnapshot } from "@/hooks/usePageMeta";
import { derivePublicSeo } from "@/lib/publicSeo";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "brand",
    brandSlug: "digitley-pune",
    centerSlug: null,
    hostname: "digitley-pune.localhost",
  }),
}));

vi.mock("@/hooks/usePortalFavicon", () => ({
  usePortalFavicon: () => undefined,
}));

vi.mock("@/lib/brandLandingApi", () => ({
  fetchBrandLandingBundle: vi.fn().mockResolvedValue({
    config: {
      meta: { siteName: "Digitley", logoUrl: null },
      hero: { line1: "Give your child", line1Serif: "", subtitle: "Programs in Pune.", backgroundImageUrl: "" },
      faq: [],
      about: { features: [], members: [] },
      sections: { faq: true },
    },
    publicCurriculum: [],
    legalPages: {},
    socialConnect: {},
  }),
}));

describe("PortalDocumentHead", () => {
  it("applies derived title and robots on a brand homepage", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <PortalDocumentHead />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(document.title).toContain("Digitley");
    });
    const robots = document.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toContain("index");
  });
});

describe("applyPublicSeoSnapshot", () => {
  it("writes JSON-LD and canonical", () => {
    applyPublicSeoSnapshot(
      derivePublicSeo({
        portal: "brand",
        pathname: "/",
        requestOrigin: "https://digitley-pune.example.com",
        portalBaseDomain: "example.com",
        brandSlug: "digitley-pune",
        siteName: "Digitley",
        heroLine: "Hello",
        faq: [{ question: "Age?", answer: "4–14" }],
        faqVisible: true,
      })
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://digitley-pune.example.com/"
    );
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBeGreaterThan(0);
  });
});
