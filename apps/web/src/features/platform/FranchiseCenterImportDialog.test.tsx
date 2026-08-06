import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FranchiseCenterImportDialog } from "./FranchiseCenterImportDialog";

const importFranchiseCentersMock = vi.fn();

vi.mock("@/lib/franchiseCenterImportApi", () => ({
  importFranchiseCenters: (...args: unknown[]) => importFranchiseCentersMock(...args),
}));

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

describe("FranchiseCenterImportDialog", () => {
  beforeEach(() => {
    polyfillDialog();
    importFranchiseCentersMock.mockReset();
    importFranchiseCentersMock.mockResolvedValue({
      result: { created: [{ row: 2, center_id: "c1", slug: "andheri-west" }], errors: [] },
      error: null,
    });
  });

  it("shows template actions when open", () => {
    render(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    expect(screen.getByRole("heading", { name: "Import franchise centers" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Download template" })).toBeDefined();
    expect(screen.getByText("Choose CSV file")).toBeDefined();
  });

  it("previews valid CSV and imports ready rows", async () => {
    const onImported = vi.fn();
    render(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={onImported}
      />
    );

    const csv = `center_slug,name,city
andheri-west,Andheri West,Mumbai`;

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([csv], "centers.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("1 row ready to import")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Import 1 center" }));

    await waitFor(() => {
      expect(importFranchiseCentersMock).toHaveBeenCalledWith("b1", [
        expect.objectContaining({ center_slug: "andheri-west", name: "Andheri West", city: "Mumbai" }),
      ]);
      expect(onImported).toHaveBeenCalled();
    });
  });

  it("regression_rejects_malicious_csv_extension", async () => {
    render(
      <FranchiseCenterImportDialog
        brandId="b1"
        brandSlug="abacusworld"
        open
        onClose={() => undefined}
        onImported={() => undefined}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["center_slug,name,city"], "payload.exe.csv.bak", { type: "application/octet-stream" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/Only \.csv/);
    });
    expect(importFranchiseCentersMock).not.toHaveBeenCalled();
  });
});
