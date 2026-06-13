import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandCenterDetailPage } from "./BrandCenterDetailPage";

describe("BrandCenterDetailPage", () => {
  it("regression_redirects_to_centers_query_param", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={["/app/centers/koramangala"]}>
        <QueryClientProvider client={qc}>
          <Routes>
            <Route path="/app/centers/:centerSlug" element={<BrandCenterDetailPage />} />
            <Route path="/app/centers" element={<div>Centers workspace</div>} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Centers workspace")).toBeDefined();
    });
  });
});
