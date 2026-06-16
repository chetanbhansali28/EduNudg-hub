import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { BatchesPage } from "./BatchesPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ centerId: "c1", brandId: "b1" }),
}));

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

const fetchCenterBatches = vi.fn();
const fetchAuthorizedPrograms = vi.fn();
const fetchBatchEnrollmentCounts = vi.fn();
const fetchLevels = vi.fn();

vi.mock("@/lib/centerBatchesApi", () => ({
  fetchCenterBatches: (...args: unknown[]) => fetchCenterBatches(...args),
  fetchAuthorizedPrograms: (...args: unknown[]) => fetchAuthorizedPrograms(...args),
  fetchBatchEnrollmentCounts: (...args: unknown[]) => fetchBatchEnrollmentCounts(...args),
  softDeleteCenterBatch: vi.fn(),
  upsertCenterBatch: vi.fn(),
}));

vi.mock("@/lib/curriculumApi", () => ({
  fetchLevels: (...args: unknown[]) => fetchLevels(...args),
}));

const sampleBatch = {
  id: "batch-1",
  name: "Morning batch",
  is_open_for_enrollment: true,
  program_id: "p1",
  level_start_id: "l1",
  level_end_id: "l3",
  schedule: { max_students: 20 },
  created_at: "2026-06-01T08:00:00Z",
  programs: { name: "Abacus Core" },
  level_start: { name: "Level 1" },
  level_end: { name: "Level 3" },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <BatchesPage />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("BatchesPage", () => {
  beforeEach(() => {
    fetchCenterBatches.mockResolvedValue([sampleBatch]);
    fetchAuthorizedPrograms.mockResolvedValue([{ id: "p1", name: "Abacus Core" }]);
    fetchBatchEnrollmentCounts.mockResolvedValue(new Map([["batch-1", 5]]));
    fetchLevels.mockResolvedValue([
      { id: "l1", name: "Level 1", sort_order: 1 },
      { id: "l3", name: "Level 3", sort_order: 3 },
    ]);
  });

  it("regression_center_batches_catalog_workspace_theme", async () => {
    renderPage();

    expect(await screen.findByText("Active Batches")).toBeDefined();
    expect(screen.getByText(/Manage schedules, enrollment status/i)).toBeDefined();
    expect(await screen.findByText("Morning batch")).toBeDefined();
    expect(screen.getByText("5/20 Students")).toBeDefined();
    expect(document.querySelector(".ed-catalog-workspace")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Add Batch" })).toBeDefined();
  });

  it("regression_edit_opens_batch_form_with_existing_values", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("Morning batch")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: "Edit Morning batch" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit Batch" })).toBeDefined();
    });

    expect(screen.getByDisplayValue("Morning batch")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save Batch" })).toBeDefined();
  });
});
