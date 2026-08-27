import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@edunudg/ui";
import { AuditLogsPageView } from "./AuditLogsPageView";

describe("AuditLogsPageView", () => {
  it("renders audit table and metadata panel", () => {
    render(
      <ThemeProvider>
        <AuditLogsPageView
          logs={[
            {
              id: "log-1",
              action: "login",
              resource_type: "auth",
              created_at: new Date().toISOString(),
              payload: { admin_name: "Jane Doe", ip_address: "192.168.1.10" },
            },
          ]}
        />
      </ThemeProvider>
    );

    expect(screen.getAllByText("Audit Logs").length).toBeGreaterThan(0);
    expect(screen.getByText("Jane Doe")).toBeDefined();
    expect(document.querySelector(".ed-audit-table")).toBeTruthy();
    expect(screen.getByText("Entry Metadata")).toBeDefined();
    expect(screen.getAllByText("Auth").length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText(/Search email, action, IP/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Page 1 of 1/).length).toBeGreaterThan(0);
  });

  it("regression_audit_copy_json_writes_clipboard", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ThemeProvider>
        <AuditLogsPageView
          logs={[
            {
              id: "log-copy",
              action: "login",
              resource_type: "auth",
              source: "auth",
              created_at: new Date().toISOString(),
              payload: { admin_name: "Jane Doe" },
            },
          ]}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Copy JSON" })[0]!);
    expect(writeText).toHaveBeenCalled();
    expect(String(writeText.mock.calls[0]?.[0])).toContain("log-copy");
  });

  it("regression_tenant_audit_omits_errors_and_mutations_streams", () => {
    render(
      <ThemeProvider>
        <AuditLogsPageView
          variant="tenant"
          logs={[
            {
              id: "log-1",
              action: "export",
              resource_type: "franchise_csv",
              source: "access",
              created_at: new Date().toISOString(),
            },
          ]}
        />
      </ThemeProvider>
    );
    expect(screen.queryAllByText("Errors")).toHaveLength(0);
    expect(screen.queryAllByText("Mutations")).toHaveLength(0);
    expect(screen.getAllByText("Access").length).toBeGreaterThan(0);
  });
});
