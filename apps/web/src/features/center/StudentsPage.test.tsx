import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentsPage } from "./StudentsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    brandId: "brand-1",
    centerId: "center-1",
    brandSlug: "abacus",
    centerSlug: "koramangala",
    hostname: "koramangala.abacus.localhost",
  }),
}));

vi.mock("@/lib/centerBatchesApi", () => ({
  markBatchJoinsSeen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/centerStudentsApi", () => ({
  fetchCenterStudents: vi.fn().mockResolvedValue([]),
}));

describe("StudentsPage", () => {
  it("regression_center_students_page_matches_curriculum_stats_chrome", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <StudentsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Students" })).toBeDefined();
    expect(screen.queryByText(/Browse and order kits for your center/i)).toBeNull();
    expect(screen.getByText(/Manage enrollments, batches, portal access/i)).toBeDefined();
    expect(container.querySelector(".ed-lead-kpi-grid")).toBeTruthy();
    const kpiLabels = [...container.querySelectorAll(".ed-lead-kpi__label")].map((el) => el.textContent);
    expect(kpiLabels).toEqual(["Linked", "Unassigned", "Programs", "Total"]);
    expect(screen.getByRole("tablist", { name: "Student filter" })).toBeDefined();
    expect(screen.getByRole("link", { name: "+ Add students" })).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by student name or ID/i)).toBeDefined();
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
  });
});
