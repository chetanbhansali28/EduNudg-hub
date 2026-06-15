import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { CenterSettingsPage } from "./CenterSettingsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    brandId: "brand-1",
    centerId: "center-1",
    brandSlug: "abacusworld",
    centerSlug: "koramangala",
    hostname: null,
  }),
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({ user: { email: "owner@gmail.com" } }),
}));

vi.mock("@/lib/centerProfileApi", () => ({
  fetchCenterPublicProfile: vi.fn().mockResolvedValue({
    id: "center-1",
    name: "Koramangala",
    slug: "koramangala",
    status: "active",
    updatedAt: "2026-06-15T10:42:00Z",
    displayName: "Abacus Koramangala",
    shortDescription: "South Bengaluru center",
    addressLine1: "12 Main Road",
    city: "Bengaluru",
    region: "Karnataka",
    pincode: "560034",
    country: "IN",
    contactPhone: "+919876543210",
    photoUrl: "",
    socialLinks: [{ platform: "Facebook", url: "https://facebook.com/center" }],
  }),
  updateCenterPublicProfile: vi.fn(),
}));

vi.mock("./CenterPhotoUpload", () => ({
  CenterPhotoUpload: () => <div data-testid="center-photo-upload">Photo</div>,
}));

describe("CenterSettingsPage", () => {
  it("regression_center_settings_catalog_theme", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterSettingsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Settings")).toBeDefined();
    expect(await screen.findByText("Account")).toBeDefined();
    expect(await screen.findByText("Public Center Profile")).toBeDefined();
    expect(await screen.findByLabelText("Center ID")).toBeDefined();
    expect(await screen.findByLabelText("Owner email")).toHaveProperty("value", "owner@gmail.com");
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDefined();
    expect(screen.getByDisplayValue("Abacus Koramangala")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save profile" })).toBeDefined();
    expect(document.querySelector(".ed-settings-stack")).toBeTruthy();
  });

  it("regression_center_settings_save_profile_button_present", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <CenterSettingsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findByText("Save profile");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByDisplayValue("Abacus Koramangala")).toBeDefined();
  });
});
