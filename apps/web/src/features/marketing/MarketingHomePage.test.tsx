import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";

vi.mock("./enterprise/EnterprisePlatformContent", () => ({
  EnterprisePlatformContent: () => <div data-testid="enterprise-content" />,
}));

vi.mock("@/lib/homepageApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/homepageApi")>();
  return {
    ...actual,
    fetchHomepageConfig: vi.fn().mockResolvedValue(DEFAULT_HOMEPAGE_CONFIG),
  };
});

describe("MarketingHomePage", () => {
  it("regression_platform_uses_enterprise_layout", async () => {
    const { MarketingHomePage } = await import("./MarketingHomePage");
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MarketingHomePage />
      </QueryClientProvider>
    );
    expect(await screen.findByTestId("enterprise-content")).toBeDefined();
  });
});
