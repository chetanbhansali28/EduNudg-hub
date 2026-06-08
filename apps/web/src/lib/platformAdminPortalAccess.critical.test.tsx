/**
 * CRITICAL: Platform admin cross-portal access (customer support handoff).
 * If these tests fail, platform admins cannot reliably open brand/center/learn/parents portals signed-in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { PortalTarget } from "@/lib/brandPortalUrl";
import {
  parentsPortalUrl,
  portalBackendUrl,
  portalHandoffLoginUrl,
  portalTargetFromDomain,
} from "@/lib/brandPortalUrl";
import { hasPortalMembership } from "@/lib/portalMembership";
import { openPortalAsPlatformAdmin, requestPlatformPortalHandoff } from "@/lib/portalHandoffApi";
import { PortalOpenButton } from "@/features/platform/PortalOpenButton";
import { BrandsPage } from "@/features/platform/BrandsPage";

const invokeMock = vi.fn();
const fromMock = vi.fn();

const PLATFORM_ADMIN_MEMBERSHIP = {
  id: "m-platform",
  role_key: "platform_admin",
  scope_type: "platform" as const,
  brand_id: null,
  center_id: null,
};

const PORTAL_TARGETS: { label: string; target: PortalTarget; handoffLogin: string; backend: string }[] = [
  {
    label: "brand staff backend",
    target: { portalType: "brand", brandSlug: "smart-brain-abacus", hostname: "smart-brain-abacus.localhost" },
    handoffLogin: "http://smart-brain-abacus.localhost:9000/auth/handoff?next=%2Fapp",
    backend: "http://smart-brain-abacus.localhost:9000/app",
  },
  {
    label: "center staff backend",
    target: {
      portalType: "center",
      brandSlug: "smart-brain-abacus",
      centerSlug: "koramangala",
      hostname: "koramangala.smart-brain-abacus.localhost",
    },
    handoffLogin: "http://koramangala.smart-brain-abacus.localhost:9000/auth/handoff?next=%2Fapp",
    backend: "http://koramangala.smart-brain-abacus.localhost:9000/app",
  },
  {
    label: "student learn portal",
    target: { portalType: "learn", brandSlug: "smart-brain-abacus", hostname: "learn.smart-brain-abacus.localhost" },
    handoffLogin: "http://learn.smart-brain-abacus.localhost:9000/auth/handoff?next=%2F",
    backend: "http://learn.smart-brain-abacus.localhost:9000/",
  },
  {
    label: "parents portal",
    target: {
      portalType: "parents",
      brandSlug: "smart-brain-abacus",
      hostname: "parents.smart-brain-abacus.localhost",
    },
    handoffLogin: "http://parents.smart-brain-abacus.localhost:9000/auth/handoff?next=%2F",
    backend: "http://parents.smart-brain-abacus.localhost:9000/",
  },
];

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
    functions: { invoke: invokeMock },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

describe("CRITICAL platform admin portal access", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    invokeMock.mockReset();
    fromMock.mockReset();
    vi.stubGlobal("open", vi.fn());
    Object.defineProperty(window, "location", {
      value: { protocol: "http:", hostname: "localhost", port: "9000" },
      writable: true,
    });
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        const c = {
          select: vi.fn(() => c),
          is: vi.fn(() => c),
          order: vi.fn(() =>
            Promise.resolve({
              data: [{ id: "b1", slug: "demo", name: "Demo Brand", status: "active", logo_url: null }],
              error: null,
            })
          ),
        };
        return c;
      }
      return {
        select: vi.fn(() => ({ is: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })),
      };
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  it.each(PORTAL_TARGETS)("critical_handoff_login_url_for_$label", ({ target, handoffLogin }) => {
    expect(portalHandoffLoginUrl(target)).toBe(handoffLogin);
  });

  it.each(PORTAL_TARGETS)("critical_backend_url_for_$label", ({ target, backend }) => {
    expect(portalBackendUrl(target)).toBe(backend);
  });

  it.each(PORTAL_TARGETS)("critical_magic_link_handoff_for_$label", async ({ target, handoffLogin }) => {
    invokeMock.mockResolvedValue({ data: { url: "https://auth.example/magic" }, error: null });

    await openPortalAsPlatformAdmin(target);

    expect(invokeMock).toHaveBeenCalledWith("platform-portal-handoff", {
      body: { redirectTo: handoffLogin },
    });
    expect(window.open).toHaveBeenCalledWith("https://auth.example/magic", "_blank", "noopener,noreferrer");
  });

  it("critical_platform_admin_has_membership_on_brand_and_center_portals", () => {
    const brandTenant = {
      portalType: "brand" as const,
      hostname: "smart-brain-abacus.localhost",
      brandId: "brand-1",
      centerId: null,
      brandSlug: "smart-brain-abacus",
      centerSlug: null,
    };
    const centerTenant = {
      portalType: "center" as const,
      hostname: "koramangala.smart-brain-abacus.localhost",
      brandId: "brand-1",
      centerId: "center-1",
      brandSlug: "smart-brain-abacus",
      centerSlug: "koramangala",
    };

    expect(hasPortalMembership([PLATFORM_ADMIN_MEMBERSHIP], brandTenant)).toBe(true);
    expect(hasPortalMembership([PLATFORM_ADMIN_MEMBERSHIP], centerTenant)).toBe(true);
  });

  it("critical_domain_rows_resolve_open_targets_for_all_portal_types", () => {
    const brandSlug = "smart-brain-abacus";
    expect(portalTargetFromDomain("brand", "smart-brain-abacus.localhost", brandSlug)?.portalType).toBe("brand");
    expect(portalTargetFromDomain("center", "koramangala.smart-brain-abacus.localhost", brandSlug)?.centerSlug).toBe(
      "koramangala"
    );
    expect(portalTargetFromDomain("learn", "learn.smart-brain-abacus.localhost", brandSlug)?.portalType).toBe("learn");
    expect(portalTargetFromDomain("parents", "parents.smart-brain-abacus.localhost", brandSlug)?.portalType).toBe(
      "parents"
    );
    expect(parentsPortalUrl(brandSlug)).toBe("http://parents.smart-brain-abacus.localhost:9000/");
  });

  it("critical_portal_open_button_falls_back_to_backend_when_handoff_fails", async () => {
    invokeMock.mockResolvedValue({ data: { error: "Platform admin required" }, error: null });

    const target = PORTAL_TARGETS[0]!.target;
    render(<PortalOpenButton target={target} label="Brand backend" />);
    fireEvent.click(screen.getByRole("button", { name: "Brand backend" }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(PORTAL_TARGETS[0]!.backend, "_blank", "noopener,noreferrer");
    });
  });

  it("critical_brands_page_brand_backend_triggers_handoff", async () => {
    invokeMock.mockResolvedValue({ data: { url: "https://auth.example/magic" }, error: null });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter initialEntries={["/admin/brands"]}>
        <QueryClientProvider client={qc}>
          <Routes>
            <Route path="/admin/brands" element={<BrandsPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Brand backend" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("platform-portal-handoff", {
        body: { redirectTo: "http://demo.localhost:9000/auth/handoff?next=%2Fapp" },
      });
    });
  });

  it("critical_requestPlatformPortalHandoff_surfaces_edge_function_errors", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "Platform admin required" } });

    const result = await requestPlatformPortalHandoff("http://demo.localhost:9000/auth/handoff?next=%2Fapp");

    expect(result.url).toBeNull();
    expect(result.error).toBe("Platform admin required");
  });
});
