import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CenterStudentImportDialog } from "./CenterStudentImportDialog";

const importCenterStudentsMock = vi.fn();

vi.mock("@/lib/centerStudentImportApi", () => ({
  importCenterStudents: (...args: unknown[]) => importCenterStudentsMock(...args),
}));

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

describe("CenterStudentImportDialog", () => {
  beforeEach(() => {
    polyfillDialog();
    importCenterStudentsMock.mockReset();
    importCenterStudentsMock.mockResolvedValue({
      result: { created: [{ row: 2, student_id: "stu-1" }], skipped: [], errors: [] },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders import steps when open", () => {
    render(
      <CenterStudentImportDialog
        centerId="center-1"
        centerSlug="smart-brain-abacus"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    expect(screen.getByRole("heading", { name: "Import students" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Download template" })).toBeDefined();
  });

  it("imports valid CSV rows", async () => {
    const onImported = vi.fn();
    const onClose = vi.fn();
    const csv = `student_name,parent_name,whatsapp,email
Aarav Sharma,Priya Sharma,9876543210,priya@example.com`;

    render(
      <CenterStudentImportDialog
        centerId="center-1"
        centerSlug="smart-brain-abacus"
        open
        onClose={onClose}
        onImported={onImported}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([csv], "students.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Import 1 student" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Import 1 student" }));

    await waitFor(() => {
      expect(importCenterStudentsMock).toHaveBeenCalledWith("center-1", [
        expect.objectContaining({
          student_name: "Aarav Sharma",
          parent_name: "Priya Sharma",
          whatsapp: "9876543210",
          email: "priya@example.com",
        }),
      ]);
      expect(onImported).toHaveBeenCalled();
    });
  });
});
