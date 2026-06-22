import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { AuditLogsPage } from "./AuditLogsPage";

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  }),
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
      (await screen.findAllByText(/Track system-wide administrative actions and security events/)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/No audit events yet/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brand signup approved or rejected/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Log event")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });
});
