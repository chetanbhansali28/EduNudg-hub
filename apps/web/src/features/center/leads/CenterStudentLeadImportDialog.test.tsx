import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CenterStudentLeadImportDialog } from "./CenterStudentLeadImportDialog";

const importCenterStudentLeadsMock = vi.fn();

vi.mock("@/lib/centerStudentLeadImportApi", () => ({
  importCenterStudentLeads: (...args: unknown[]) => importCenterStudentLeadsMock(...args),
}));

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

describe("CenterStudentLeadImportDialog", () => {
  beforeEach(() => {
    polyfillDialog();
    importCenterStudentLeadsMock.mockReset();
    importCenterStudentLeadsMock.mockResolvedValue({
      result: { created: [{ row: 2, lead_id: "lead-1" }], merged: [], errors: [] },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders import steps when open", () => {
    render(
      <CenterStudentLeadImportDialog
        centerId="center-1"
        centerSlug="arti-drawing"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    expect(screen.getByRole("heading", { name: "Import student leads" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Download template" })).toBeDefined();
  });

  it("imports valid CSV rows", async () => {
    const onImported = vi.fn();
    const onClose = vi.fn();
    const csv = `parent_name,whatsapp,email,child_name
Priya Sharma,+919876543210,priya@example.com,Aarav Sharma`;

    render(
      <CenterStudentLeadImportDialog
        centerId="center-1"
        centerSlug="arti-drawing"
        open
        onClose={onClose}
        onImported={onImported}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([csv], "leads.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Import 1 lead" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Import 1 lead" }));

    await waitFor(() => {
      expect(importCenterStudentLeadsMock).toHaveBeenCalledWith("center-1", [
        expect.objectContaining({
          parent_name: "Priya Sharma",
          whatsapp: "919876543210",
          email: "priya@example.com",
          child_name: "Aarav Sharma",
        }),
      ]);
      expect(onImported).toHaveBeenCalled();
    });
  });
});
