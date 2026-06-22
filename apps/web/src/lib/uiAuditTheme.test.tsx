import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  AuditActionBadge,
  AuditPageHeader,
  AuditShell,
  AuditSummaryCard,
  ThemeProvider,
} from "@edunudg/ui";

describe("Audit UI theme", () => {
  it("renders page header and summary card", () => {
    render(
      <ThemeProvider>
        <AuditShell>
          <AuditPageHeader
            title="Audit Logs"
            subtitle="Track system-wide administrative actions and security events."
          />
          <AuditSummaryCard label="Total Events (24h)" value="1,284" trend="+12%" />
          <AuditActionBadge label="LOGIN" tone="blue" />
        </AuditShell>
      </ThemeProvider>
    );

    expect(screen.getByText("Audit Logs")).toBeDefined();
    expect(screen.getByText("1,284")).toBeDefined();
    expect(screen.getByText("LOGIN")).toBeDefined();
    expect(document.querySelector(".ed-audit")).toBeTruthy();
  });
});
