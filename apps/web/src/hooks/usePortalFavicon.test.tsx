import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePortalFavicon } from "./usePortalFavicon";

const tenantState = vi.hoisted(() => ({
  portalType: "brand" as "brand" | "platform" | "center",
  hostname: "abacusworld.localhost",
  brandId: "a0000000-0000-4000-8000-000000000001",
  centerId: null,
  brandSlug: "abacusworld",
  centerSlug: null,
}));

const brandingState = vi.hoisted(() => ({
  data: {
    brandId: "a0000000-0000-4000-8000-000000000001",
    brandSlug: "abacusworld",
    brandName: "Abacus World",
    brandLogoUrl: "https://cdn.example/abacusworld-logo.png",
    centerId: null,
    centerSlug: null,
    centerName: null,
    loginHeadline: null,
    loginSubtext: null,
  },
  isFetched: true,
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => tenantState,
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => brandingState,
}));

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageConfig: vi.fn().mockResolvedValue({
    meta: { logoUrl: "https://cdn.example/platform-logo.png", siteName: "EduNudg" },
  }),
}));

function FaviconProbe() {
  usePortalFavicon();
  return null;
}

function renderFavicon() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FaviconProbe />
    </QueryClientProvider>
  );
}

describe("usePortalFavicon", () => {
  beforeEach(() => {
    document.head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());
    tenantState.portalType = "brand";
    brandingState.data.brandLogoUrl = "https://cdn.example/abacusworld-logo.png";
    brandingState.isFetched = true;
  });

  afterEach(() => {
    document.head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());
  });

  it("regression_sets_brand_logo_as_favicon_on_brand_portal", async () => {
    const existing = document.createElement("link");
    existing.rel = "icon";
    existing.href = "/favicon.svg";
    document.head.appendChild(existing);

    renderFavicon();

    const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.href).toBe("https://cdn.example/abacusworld-logo.png");
      expect(link.type).toBe("image/png");
    }
  });

  it("regression_sets_platform_logo_as_favicon_on_platform_portal", async () => {
    tenantState.portalType = "platform";
    renderFavicon();

    await vi.waitFor(() => {
      const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      expect(link?.href).toBe("https://cdn.example/platform-logo.png");
    });
  });

  it("falls_back_to_default_favicon_on_platform_portal_without_logo", async () => {
    const { fetchHomepageConfig } = await import("@/lib/homepageApi");
    vi.mocked(fetchHomepageConfig).mockResolvedValueOnce({
      meta: { siteName: "EduNudg", logoUrl: null },
    } as Awaited<ReturnType<typeof fetchHomepageConfig>>);

    tenantState.portalType = "platform";
    renderFavicon();

    await vi.waitFor(() => {
      const link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      expect(link?.href).toContain("/favicon.svg");
    });
  });
});
