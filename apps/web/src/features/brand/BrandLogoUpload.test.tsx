import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandLogoUpload } from "./BrandLogoUpload";

vi.mock("@/lib/brandLogoStorage", () => ({
  uploadBrandLogo: vi.fn(),
}));

function renderUpload(brandId: string | null, currentLogoUrl?: string | null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrandLogoUpload brandId={brandId} currentLogoUrl={currentLogoUrl} />
    </QueryClientProvider>
  );
}

describe("BrandLogoUpload", () => {
  it("prompts to create brand when brandId is null", () => {
    renderUpload(null);
    expect(screen.getByText(/create the brand first/i)).toBeDefined();
  });

  it("renders file input when brandId is set", () => {
    renderUpload("b1", null);
    expect(screen.getByLabelText("Brand logo")).toBeDefined();
  });
});
