import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandFeatureTogglesCard } from "./BrandFeatureTogglesCard";

const updateMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => {
      if (table !== "brand_settings") throw new Error(`unexpected table ${table}`);
      return {
        update: (...args: unknown[]) => {
          updateMock(...args);
          return { eq: () => Promise.resolve({ error: null }) };
        },
        insert: (...args: unknown[]) => {
          insertMock(...args);
          return Promise.resolve({ error: null });
        },
      };
    },
  }),
}));

function renderCard(settings: Record<string, unknown> = { features: { campaigns: true } }) {
  const onSaved = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <BrandFeatureTogglesCard
        brandId="brand-1"
        settingsId="settings-1"
        settings={settings}
        onSaved={onSaved}
      />
    </QueryClientProvider>
  );
  return { onSaved };
}

describe("BrandFeatureTogglesCard", () => {
  beforeEach(() => {
    updateMock.mockReset();
    insertMock.mockReset();
  });

  it("regression_platform_brand_features_section_lists_modules", () => {
    renderCard();
    expect(screen.getByText("Features")).toBeDefined();
    expect(screen.getByText("Student leads")).toBeDefined();
    expect(screen.getByText("Merchandise catalog & orders")).toBeDefined();
  });

  it("regression_saves_feature_flags_to_brand_settings", async () => {
    renderCard({ features: { merchandise: false } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0]?.[0] as { settings: { features: Record<string, boolean> } };
    expect(payload.settings.features).toBeDefined();
  });
});
