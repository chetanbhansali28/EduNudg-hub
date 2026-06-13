import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterCurriculumAuthPanel } from "./CenterCurriculumAuthPanel";

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

const rpcMock = vi.fn();

vi.mock("@/lib/centerProgramApi", () => ({
  fetchBrandPrograms: vi.fn(),
  fetchCenterAuthorizedPrograms: vi.fn(),
  syncCenterProgramEnablement: vi.fn(),
}));

import {
  fetchBrandPrograms,
  fetchCenterAuthorizedPrograms,
  syncCenterProgramEnablement,
} from "@/lib/centerProgramApi";

describe("CenterCurriculumAuthPanel", () => {
  beforeEach(() => {
    vi.mocked(fetchBrandPrograms).mockReset();
    vi.mocked(fetchCenterAuthorizedPrograms).mockReset();
    vi.mocked(syncCenterProgramEnablement).mockReset();
    vi.mocked(fetchBrandPrograms).mockResolvedValue([
      { id: "p1", name: "Abacus Core" },
      { id: "p2", name: "Vedic Maths" },
    ]);
    vi.mocked(fetchCenterAuthorizedPrograms).mockResolvedValue([]);
    vi.mocked(syncCenterProgramEnablement).mockResolvedValue(undefined);
  });

  function renderPanel() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <CenterCurriculumAuthPanel centerId="c1" centerName="Koramangala" brandId="b1" />
      </QueryClientProvider>,
    );
  }

  it("lists all courses with toggles off by default", async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText("Abacus Core")).toBeDefined();
      expect(screen.getByText("Vedic Maths")).toBeDefined();
    });
  });

  it("enables course via program sync", async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText("Abacus Core")).toBeDefined());
    fireEvent.click(screen.getByRole("switch", { name: /Abacus Core/i }));
    await waitFor(() => {
      expect(syncCenterProgramEnablement).toHaveBeenCalledWith("c1", ["p1"]);
    });
  });
});
