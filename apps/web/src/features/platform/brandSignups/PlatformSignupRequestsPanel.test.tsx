import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlatformSignupRequestsPanel } from "./PlatformSignupRequestsPanel";

const sampleSignup = {
  id: "signup-1",
  requested_name: "Abacus World",
  admin_full_name: "Raj Patel",
  email: "raj@example.com",
  phone_e164: "+919876543210",
  city: "Mumbai",
  country: "IN",
  message: "Launching in Q3",
  status: "pending",
  proposed_slug: null,
  rejected_reason: null,
  created_at: "2026-06-01T10:00:00Z",
};

vi.mock("@/lib/platformBrandSignupApi", () => ({
  listPendingPlatformSignups: vi.fn(() => Promise.resolve([sampleSignup])),
  approvePlatformBrandSignup: vi.fn(),
  rejectPlatformBrandSignup: vi.fn(),
}));

describe("PlatformSignupRequestsPanel", () => {
  it("regression_master_detail_selects_signup", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <PlatformSignupRequestsPanel />
      </QueryClientProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: /Abacus World/i }));
    expect(screen.getByText("Launching in Q3")).toBeDefined();
    expect(screen.getByRole("button", { name: "Approve & create brand" })).toBeDefined();
  });
});
