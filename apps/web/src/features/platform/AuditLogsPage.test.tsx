import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
        <AuditLogsPage />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Append-only record of platform admin actions/)).toBeDefined();
    expect(await screen.findByText(/No audit events yet/)).toBeDefined();
    expect(screen.getByText(/Brand signup approved or rejected/)).toBeDefined();
    expect(screen.queryByText("Log event")).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });
});
