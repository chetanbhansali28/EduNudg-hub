import { describe, expect, it, vi } from "vitest";
import type { CenterBatchRow } from "./centerBatchesApi";
import {
  buildBatchListPresentation,
  buildProgramFilterOptions,
  exportBatchesCsv,
  filterBatchesByProgram,
  formatBatchLevelRange,
  sortCenterBatches,
} from "./centerBatchesHelpers";

const sampleBatch: CenterBatchRow = {
  id: "b1",
  name: "Abacus - 4pm - 5pm",
  is_open_for_enrollment: true,
  program_id: "p1",
  level_start_id: "l1",
  level_end_id: "l2",
  schedule: { max_students: 20 },
  programs: { name: "Abacus" },
  level_start: { name: "Level 1" },
  level_end: { name: "Level 2" },
  created_at: "2026-06-01T08:00:00Z",
};

describe("centerBatchesHelpers", () => {
  it("formatBatchLevelRange joins start and end", () => {
    expect(formatBatchLevelRange(sampleBatch)).toBe("Level 1 to Level 2");
  });

  it("buildBatchListPresentation includes enrollment and status", () => {
    const view = buildBatchListPresentation(sampleBatch, 12);
    expect(view.enrollmentLabel).toBe("12/20 Students");
    expect(view.statusLabel).toBe("Open Enrollment");
    expect(view.statusTone).toBe("open");
  });

  it("filterBatchesByProgram filters by program id", () => {
    const other = { ...sampleBatch, id: "b2", program_id: "p2" };
    expect(filterBatchesByProgram([sampleBatch, other], "p1")).toHaveLength(1);
  });

  it("sortCenterBatches sorts by name", () => {
    const a = { ...sampleBatch, id: "a", name: "Zebra" };
    const b = { ...sampleBatch, id: "b", name: "Alpha" };
    expect(sortCenterBatches([a, b], "name").map((row) => row.name)).toEqual(["Alpha", "Zebra"]);
  });

  it("buildProgramFilterOptions prepends all batches", () => {
    expect(buildProgramFilterOptions([{ id: "p1", name: "Abacus" }])).toEqual([
      { value: "all", label: "All Batches" },
      { value: "p1", label: "Abacus" },
    ]);
  });

  it("regression_exportBatchesCsv_downloads_csv", () => {
    const click = vi.fn();
    const revoke = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      click,
      download: "",
      href: "",
    } as unknown as HTMLAnchorElement);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revoke,
    });

    exportBatchesCsv([sampleBatch], new Map([["b1", 5]]));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalled();

    createElement.mockRestore();
  });
});
