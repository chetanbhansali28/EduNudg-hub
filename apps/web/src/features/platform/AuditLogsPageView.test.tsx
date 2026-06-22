import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
  });
});
