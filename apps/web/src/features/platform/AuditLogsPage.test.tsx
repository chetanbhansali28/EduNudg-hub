import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@edunudg/ui";
import { AuditLogsPage } from "./AuditLogsPage";

vi.mock("@/lib/platformAuditApi", () => ({
  fetchPlatformAuditLogs: vi.fn().mockResolvedValue([]),
}));

describe("AuditLogsPage", () => {
  it("regression_audit_logs_read_only_no_create_form", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <AuditLogsPage />
        </ThemeProvider>
      </QueryClientProvider>
    );
    expect(
      (await screen.findAllByText(/Track sign-in, sign-out, sensitive access, errors, and administrative actions/)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/No audit events yet/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Staff or student sign-in/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Log event")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });
});
