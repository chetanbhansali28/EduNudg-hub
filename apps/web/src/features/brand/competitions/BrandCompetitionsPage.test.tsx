import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandCompetitionsPage } from "./BrandCompetitionsPage";

const membershipState = vi.hoisted(() => ({
  data: [{ role_key: "brand_owner", scope_type: "brand" }] as { role_key: string; scope_type: string }[],
}));

const sectionState = vi.hoisted(() => ({ canEdit: false }));

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({ data: membershipState.data }),
  primaryRole: () => membershipState.data[0]?.role_key ?? "guest",
}));

vi.mock("./BrandCompetitionsSection", () => ({
  BrandCompetitionsSection: ({ canEdit }: { canEdit: boolean }) => {
    sectionState.canEdit = canEdit;
    return <div data-testid="events-section">Events</div>;
  },
}));

vi.mock("./BrandCompetitionQuestionBankSection", () => ({
  BrandCompetitionQuestionBankSection: () => <div data-testid="bank-section">Bank</div>,
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <BrandCompetitionsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("BrandCompetitionsPage", () => {
  it("renders Events and Question bank tabs", () => {
    membershipState.data = [{ role_key: "brand_owner", scope_type: "brand" }];
    renderPage();
    expect(screen.getByRole("heading", { name: "Competitions", level: 1 })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Events" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Question bank" })).toBeDefined();
    expect(screen.getByTestId("events-section")).toBeDefined();
    expect(sectionState.canEdit).toBe(true);
  });

  it("regression_platformAdminCanEditCompetitions", () => {
    membershipState.data = [{ role_key: "platform_super_admin", scope_type: "platform" }];
    renderPage();
    expect(sectionState.canEdit).toBe(true);
  });
});
