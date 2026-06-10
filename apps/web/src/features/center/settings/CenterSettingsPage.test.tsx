import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    displayName: "Abacus Koramangala",
    shortDescription: "South Bengaluru center",
    addressLine1: "12 Main Road",
    city: "Bengaluru",
    region: "KA",
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
  it("regression_center_settings_shows_editable_public_profile", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterSettingsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Public center profile")).toBeDefined();
    expect(screen.getByText("Save profile")).toBeDefined();
    expect(screen.getByTestId("center-photo-upload")).toBeDefined();
    expect(screen.getByDisplayValue("Abacus Koramangala")).toBeDefined();
    expect(screen.getByText(/Sign-in email: owner@gmail.com/)).toBeDefined();
    expect(screen.getByText(/Your public website:/)).toBeDefined();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.queryByLabelText("Website")).toBeNull();
  });
});
