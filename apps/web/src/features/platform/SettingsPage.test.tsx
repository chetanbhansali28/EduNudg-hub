import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { SettingsPage } from "./SettingsPage";
import { mergePlatformIntegrations } from "@/lib/platformIntegrations";

const { savePlatformIntegrations, fetchPlatformIntegrations } = vi.hoisted(() => ({
  savePlatformIntegrations: vi.fn(async () => undefined),
  fetchPlatformIntegrations: vi.fn(async () => mergePlatformIntegrations(undefined)),
}));

vi.mock("@/lib/platformIntegrationsApi", () => ({
  fetchPlatformIntegrations,
  savePlatformIntegrations,
}));

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    savePlatformIntegrations.mockClear();
  });

  it("regression_no_marketing_homepage_section", async () => {
    renderSettings();
    expect(await screen.findByText("Platform Settings")).toBeDefined();
    expect(screen.queryByText("Marketing homepage")).toBeNull();
    expect(screen.queryByText("Open homepage editor")).toBeNull();
  });

  it("regression_platform_settings_renders_auth_and_public_cards", async () => {
    renderSettings();
    expect(await screen.findByText("Authentication")).toBeDefined();
    expect(screen.getByText("Email & Password")).toBeDefined();
    expect(screen.getByText("Public Website")).toBeDefined();
    expect(screen.getByText("Brand Signup Forms")).toBeDefined();
    expect(screen.queryByLabelText("Value (JSON)")).toBeNull();
    expect(document.querySelector(".ed-pfset-grid")).toBeTruthy();
  });

  it("regression_platform_settings_save_changes_persists_integrations", async () => {
    renderSettings();
    expect(await screen.findByText("WhatsApp OTP")).toBeDefined();
    const switches = screen.getAllByRole("checkbox");
    const whatsapp = switches.find((input) => {
      const row = input.closest(".ed-pfset-toggle-row");
      return row?.textContent?.includes("WhatsApp OTP");
    });
    expect(whatsapp).toBeDefined();
    fireEvent.click(whatsapp!);
    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect((saveButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveButton);
    await waitFor(() => expect(savePlatformIntegrations).toHaveBeenCalledOnce());
  });
});
