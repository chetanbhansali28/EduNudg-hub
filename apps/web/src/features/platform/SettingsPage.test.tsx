import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettingsPage } from "./SettingsPage";

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => {
      if (table !== "platform_settings") throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          order: () =>
            Promise.resolve({
              data: [{ id: "s1", key: "defaults", value: { timezone: "Asia/Kolkata" } }],
              error: null,
            }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
        insert: () => Promise.resolve({ error: null }),
      };
    },
  }),
}));

vi.mock("./PlatformIntegrationsCard", () => ({
  PlatformIntegrationsCard: () => <div>Integrations card</div>,
}));

describe("SettingsPage", () => {
  it("regression_no_marketing_homepage_section", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <SettingsPage />
      </QueryClientProvider>
    );
    expect(screen.queryByText("Marketing homepage")).toBeNull();
    expect(screen.queryByText("Open homepage editor")).toBeNull();
  });

  it("regression_platform_settings_use_dropdown_not_json", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <SettingsPage />
      </QueryClientProvider>
    );
    expect(await screen.findByText("Platform settings")).toBeDefined();
    expect(screen.getByLabelText("Setting")).toBeDefined();
    expect(screen.queryByLabelText("Value (JSON)")).toBeNull();
    expect(screen.getByRole("button", { name: "Save" }).closest(".ed-card__header")).toBeTruthy();
  });
});
