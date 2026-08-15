import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("student leads detail stack", () => {
  const css = readFileSync(resolve(__dirname, "studentLeads.css"), "utf8");

  it("regression_student_leads_detail_grid_is_single_column", () => {
    expect(css).toMatch(
      /\.ed-student-leads__detail-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
    );
    expect(css).not.toMatch(
      /\.ed-student-leads__detail-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.1fr\)/s,
    );
  });
});
