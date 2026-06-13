import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterCurriculumAuthPanel } from "./CenterCurriculumAuthPanel";

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock, rpc: rpcMock }),
}));

function chain(data: unknown) {
  const result = { data, error: null };
  const api = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    is: vi.fn(() => api),
    order: vi.fn(() => api),
    then: (resolve: (v: typeof result) => void) => resolve(result),
  };
  return api;
}

const brandPrograms = [
  { id: "p1", name: "Abacus Core" },
  { id: "p2", name: "Vedic Maths" },
];

const publishedVersions = [
  { id: "v1", version_number: 1, program_id: "p1", programs: { name: "Abacus Core" } },
  { id: "v2", version_number: 1, program_id: "p2", programs: { name: "Vedic Maths" } },
];

function mockTables(authorized: string[] = []) {
  fromMock.mockImplementation((table: string) => {
    if (table === "programs") return chain(brandPrograms);
    if (table === "curriculum_versions") return chain(publishedVersions);
    if (table === "center_curriculum_enablement") {
      return chain(authorized.map((curriculum_version_id) => ({ curriculum_version_id })));
    }
    return chain([]);
  });
  rpcMock.mockResolvedValue({ data: null, error: null });
}

function renderPanel() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CenterCurriculumAuthPanel centerId="c1" centerName="Koramangala" brandId="brand-1" />
    </QueryClientProvider>,
  );
}

describe("CenterCurriculumAuthPanel", () => {
  it("lists all courses with toggles off by default", async () => {
    mockTables();
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText("Abacus Core")).toBeDefined();
      expect(screen.getByText("Vedic Maths")).toBeDefined();
    });

    expect(screen.queryByRole("button", { name: /Save curriculum/i })).toBeNull();
    expect(screen.getAllByRole("switch").every((el) => el.getAttribute("aria-checked") === "false")).toBe(
      true,
    );
  });

  it("regression_toggle_assigns_course_immediately", async () => {
    mockTables();
    renderPanel();

    const abacusToggle = await screen.findByRole("switch", { name: "Abacus Core" });
    fireEvent.click(abacusToggle);

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("sync_center_curriculum_enablement", {
        p_center_id: "c1",
        p_curriculum_version_ids: ["v1"],
      });
    });
  });
});
