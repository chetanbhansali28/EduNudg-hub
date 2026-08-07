import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { CenterDetailPanel } from "./CenterDetailPanel";
import type { BrandCenterRow } from "@/lib/centerCentersApi";

const updateFranchiseCenter = vi.fn().mockResolvedValue(undefined);
const fetchCenterOwnerLoginEmail = vi.fn().mockResolvedValue("owner@arti.example.com");
const upsertCenterOwnerCredentials = vi.fn().mockResolvedValue({ error: null });
const shouldSyncCenterOwnerCredentials = vi.fn();

vi.mock("@/lib/centerCentersApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/centerCentersApi")>(
    "@/lib/centerCentersApi"
  );
  return {
    ...actual,
    fetchCenterStats: vi.fn().mockResolvedValue({
      students: 0,
      staff: 0,
      openLeads: 0,
      revenueMtd: 0,
    }),
    updateFranchiseCenter: (...args: unknown[]) => updateFranchiseCenter(...args),
    setFranchiseCenterStatus: vi.fn(),
  };
});

vi.mock("@/lib/centerOwnerCredentialsApi", () => ({
  fetchCenterOwnerLoginEmail: (...args: unknown[]) => fetchCenterOwnerLoginEmail(...args),
  upsertCenterOwnerCredentials: (...args: unknown[]) => upsertCenterOwnerCredentials(...args),
  shouldSyncCenterOwnerCredentials: (...args: unknown[]) => shouldSyncCenterOwnerCredentials(...args),
}));

vi.mock("@/lib/centerCurriculumApi", () => ({
  fetchCenterAuthorizedProgramIds: vi.fn().mockResolvedValue([]),
  setCenterCourseAuthorized: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/features/center/settings/CenterPhotoUpload", () => ({
  CenterPhotoUpload: () => <div data-testid="center-photo-upload">Photo</div>,
}));

const center: BrandCenterRow = {
  id: "center-arti",
  slug: "arti-drawing",
  name: "Arti Drawing",
  display_name: "Arti Drawing Pune",
  status: "active",
  city: "Pune",
  region: "MH",
  pincode: "411001",
  contact_phone: "+919999999999",
  address_line1: "1 Main St",
  short_description: "Art franchise",
  country: "IN",
  photo_url: null,
  social_links: [],
};

function renderPanel() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <CenterDetailPanel
          center={center}
          brandId="brand-vihaan"
          brandSlug="vihaan-abacas-pune"
          isMobile={false}
          onStatusChanged={() => undefined}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("CenterDetailPanel franchise login credentials", () => {
  beforeEach(() => {
    updateFranchiseCenter.mockClear();
    fetchCenterOwnerLoginEmail.mockClear();
    upsertCenterOwnerCredentials.mockClear();
    shouldSyncCenterOwnerCredentials.mockReset();
    shouldSyncCenterOwnerCredentials.mockReturnValue(false);
  });

  it("regression_franchise_identity_loads_login_email_from_database", async () => {
    renderPanel();
    expect(await screen.findByLabelText("Login email")).toHaveProperty(
      "value",
      "owner@arti.example.com"
    );
    expect(screen.getByText(/Franchise Identity/i)).toBeDefined();
    expect(screen.getByText(/arti-drawing\.vihaan-abacas-pune\.localhost:9000\/login/)).toBeDefined();
  });

  it("regression_profile_only_save_does_not_invoke_center_owner_credentials", async () => {
    shouldSyncCenterOwnerCredentials.mockReturnValue(false);
    renderPanel();
    await screen.findByLabelText("Login email");

    fireEvent.change(screen.getByLabelText("Franchise Name"), {
      target: { value: "Arti Drawing Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateFranchiseCenter).toHaveBeenCalled());
    expect(upsertCenterOwnerCredentials).not.toHaveBeenCalled();
  });

  it("regression_credential_save_invokes_center_owner_credentials", async () => {
    shouldSyncCenterOwnerCredentials.mockReturnValue(true);
    renderPanel();
    await screen.findByLabelText("Login email");

    fireEvent.change(screen.getByLabelText("Login email"), {
      target: { value: "new-owner@arti.example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "new-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(upsertCenterOwnerCredentials).toHaveBeenCalled());
    expect(upsertCenterOwnerCredentials).toHaveBeenCalledWith({
      centerId: "center-arti",
      brandId: "brand-vihaan",
      email: "new-owner@arti.example.com",
      password: "new-secret",
      fullName: "Arti Drawing",
    });
  });
});
