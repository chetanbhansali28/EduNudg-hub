import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BatchesPage } from "./BatchesPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ centerId: "c1", brandId: "b1" }),
}));

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

const fetchCenterBatches = vi.fn();
const fetchAuthorizedPrograms = vi.fn();
const fetchLevels = vi.fn();

vi.mock("@/lib/centerBatchesApi", () => ({
  fetchCenterBatches: (...args: unknown[]) => fetchCenterBatches(...args),
  fetchAuthorizedPrograms: (...args: unknown[]) => fetchAuthorizedPrograms(...args),
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
  schedule: null,
  programs: { name: "Abacus Core" },
  level_start: { name: "Level 1" },
  level_end: { name: "Level 3" },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BatchesPage />
    </QueryClientProvider>,
  );
}

describe("BatchesPage", () => {
  beforeEach(() => {
    fetchCenterBatches.mockResolvedValue([sampleBatch]);
    fetchAuthorizedPrograms.mockResolvedValue([{ id: "p1", name: "Abacus Core" }]);
    fetchLevels.mockResolvedValue([
      { id: "l1", name: "Level 1", sort_order: 1 },
      { id: "l3", name: "Level 3", sort_order: 3 },
    ]);
  });

  it("regression_edit_opens_batch_form_with_existing_values", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("Morning batch")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit batch" })).toBeDefined();
    });

    expect(screen.getByDisplayValue("Morning batch")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save batch" })).toBeDefined();
  });
});
