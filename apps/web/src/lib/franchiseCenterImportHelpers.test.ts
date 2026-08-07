import { describe, expect, it, vi } from "vitest";
import {
  buildImportRow,
  parseCsvText,
  parseFranchiseCenterImportCsv,
  sanitizeImportCell,
  slugifyImportSlug,
  toRpcRow,
  validateImportFile,
  validateImportRow,
} from "./franchiseCenterImportHelpers";

describe("franchiseCenterImportHelpers", () => {
  it("parses quoted CSV cells", () => {
    expect(parseCsvText('center_slug,name,city\n"west-1","Mumbai, West","Mumbai"')).toEqual([
      ["center_slug", "name", "city"],
      ["west-1", "Mumbai, West", "Mumbai"],
    ]);
  });

  it("sanitizes formula-injection prefixes", () => {
    expect(sanitizeImportCell("=cmd|'/c calc'!A0", 200)).toBe("cmd|'/c calc'!A0");
    expect(sanitizeImportCell("+1234", 200)).toBe("1234");
  });

  it("regression_sql_injection_in_name_is_plain_text_not_sql", () => {
    const row = buildImportRow({
      center_slug: "test-center",
      name: "'; DROP TABLE franchise_centers;--",
      city: "Mumbai",
    });
    expect(row.name).toContain("DROP TABLE");
    expect(validateImportRow(row, new Set())).toEqual([]);
    expect(toRpcRow(row).name).toContain("DROP TABLE");
  });

  it("regression_script_tag_in_description_is_stored_as_text", () => {
    const row = buildImportRow({
      center_slug: "safe-center",
      name: "Safe Center",
      city: "Mumbai",
      short_description: "<script>alert(1)</script>",
    });
    expect(row.short_description).toBe("<script>alert(1)</script>");
    expect(validateImportRow(row, new Set())).toEqual([]);
  });

  it("rejects duplicate slugs within the same file", () => {
    const csv = `center_slug,name,city
dup-center,One,Mumbai
dup-center,Two,Pune`;

    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.validRows).toHaveLength(1);
    expect(preview.rows[1]?.errors[0]).toMatch(/Duplicate center_slug/);
  });

  it("rejects files over row limit", () => {
    const header = "center_slug,name,city\n";
    const rows = Array.from({ length: 501 }, (_, i) => `c-${i},Name ${i},City`).join("\n");
    const preview = parseFranchiseCenterImportCsv(header + rows);
    expect(preview.fileError).toMatch(/Too many rows/);
  });

  it("validateImportFile rejects non-csv extension", () => {
    const file = new File(["a"], "centers.txt", { type: "text/plain" });
    expect(validateImportFile(file)).toMatch(/Only \.csv/);
  });

  it("slugifyImportSlug normalizes values", () => {
    expect(slugifyImportSlug("Mumbai Andheri")).toBe("mumbai-andheri");
  });

  it("parseFranchiseCenterImportCsv accepts export-style headers", () => {
    const csv = `Center Slug,Name,City,Owner Email
andheri-west,Andheri West,Mumbai,owner@example.com`;

    const preview = parseFranchiseCenterImportCsv(csv);
    expect(preview.fileError).toBeNull();
    expect(preview.validRows).toHaveLength(1);
    expect(preview.validRows[0]?.owner_email).toBe("owner@example.com");
  });
});

describe("downloadFranchiseCenterImportTemplate", () => {
  it("regression_creates_downloadable_csv_via_anchor_click", async () => {
    const { downloadFranchiseCenterImportTemplate, franchiseCenterImportTemplateCsv } = await import(
      "./franchiseCenterImportHelpers"
    );
    const click = vi.fn();
    const anchor = {
      click,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(anchor);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    try {
      downloadFranchiseCenterImportTemplate("abacusworld");
      expect(franchiseCenterImportTemplateCsv()).toContain("center_slug,name,city");
      expect(createElement).toHaveBeenCalledWith("a");
      expect(createObjectURL).toHaveBeenCalled();
      expect(anchor.download).toBe("franchise-centers-import-abacusworld.csv");
      expect(anchor.href).toBe("blob:mock");
      expect(click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    } finally {
      createElement.mockRestore();
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    }
  });
});
