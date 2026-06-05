import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlatformIntegrationsCard } from "./PlatformIntegrationsCard";
import { PLATFORM_INTEGRATION_DEFAULTS } from "@/lib/platformIntegrations";

const fetchPlatformIntegrations = vi.fn();
const savePlatformIntegrations = vi.fn();

vi.mock("@/lib/platformIntegrationsApi", () => ({
  fetchPlatformIntegrations: () => fetchPlatformIntegrations(),
  savePlatformIntegrations: (...args: unknown[]) => savePlatformIntegrations(...args),
}));

function renderCard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PlatformIntegrationsCard />
    </QueryClientProvider>
  );
}

describe("PlatformIntegrationsCard", () => {
  beforeEach(() => {
    fetchPlatformIntegrations.mockReset();
    savePlatformIntegrations.mockReset();
    fetchPlatformIntegrations.mockResolvedValue({ ...PLATFORM_INTEGRATION_DEFAULTS });
    savePlatformIntegrations.mockResolvedValue(undefined);
  });

  it("regression_renders_integration_toggles_and_saves", async () => {
    renderCard();
    expect(await screen.findByRole("switch", { name: "Email & password login" })).toBeDefined();

    fireEvent.click(screen.getByRole("switch", { name: "Payment gateway" }));
    fireEvent.click(screen.getByRole("button", { name: "Save integrations" }));

    await waitFor(() => expect(savePlatformIntegrations).toHaveBeenCalledTimes(1));
    const saved = savePlatformIntegrations.mock.calls[0][0] as Record<string, boolean>;
    expect(saved.payment_gateway).toBe(true);
  });
});
