import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchStudentProgramLadders } from "./studentProgressApi";
import { StudentLearnRpcError } from "./studentLearnApi";
import {
  parseStudentLearnError,
  shouldRetryStudentLearnQuery,
  studentProgressEmptyMessage,
  studentProgressErrorMessage,
  studentLearnErrorText,
} from "./studentLearnErrors";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("studentProgressApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("fetchStudentProgramLadders returns empty array when RPC returns null", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(fetchStudentProgramLadders("brand-1")).resolves.toEqual([]);
  });

  it("fetchStudentProgramLadders returns ladders from RPC", async () => {
    const ladder = {
      program_id: "cv1",
      program_name: "Abacus",
      batches: [],
      curriculum_ladder: { current_level_id: null, completion_pct: 0, levels: [] },
      assessments: [],
    };
    rpc.mockResolvedValue({ data: [ladder], error: null });
    await expect(fetchStudentProgramLadders("brand-1")).resolves.toEqual([ladder]);
    expect(rpc).toHaveBeenCalledWith("get_student_program_ladders", { p_brand_id: "brand-1" });
  });

  it("regression_get_student_program_ladders_400_column_error throws StudentLearnRpcError for enrollment", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "NO_ACTIVE_ENROLLMENT", code: "P0001" },
    });
    await expect(fetchStudentProgramLadders("brand-1")).rejects.toBeInstanceOf(StudentLearnRpcError);
  });

  it("regression_get_student_program_ladders_400_sql_error surfaces as generic error", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        message: "column a.level_id does not exist",
        code: "42703",
        details: "Bad Request",
      },
    });
    await expect(fetchStudentProgramLadders("brand-1")).rejects.toMatchObject({
      message: expect.stringContaining("level_id"),
    });
  });
});

describe("studentLearnErrors progress helpers", () => {
  it("studentProgressEmptyMessage when no ladders", () => {
    expect(studentProgressEmptyMessage(0)).toMatch(/No program progress yet/);
    expect(studentProgressEmptyMessage(1)).toBeNull();
  });

  it("studentProgressErrorMessage for known codes", () => {
    expect(studentProgressErrorMessage({ message: "NO_ACTIVE_ENROLLMENT" })).toMatch(/active center enrollment/);
    expect(studentProgressErrorMessage({ message: "NO_STUDENT_LINK" })).toMatch(/not linked/);
  });

  it("regression_bad_request_shows_friendly_progress_message", () => {
    expect(
      studentProgressErrorMessage({ message: "Bad Request", details: "column a.level_id does not exist" })
    ).toMatch(/temporarily unavailable/);
  });

  it("parseStudentLearnError reads details field", () => {
    expect(parseStudentLearnError({ message: "Error", details: "NO_STUDENT_LINK" })).toBe("NO_STUDENT_LINK");
  });

  it("studentLearnErrorText concatenates postgrest fields", () => {
    expect(studentLearnErrorText({ message: "A", details: "B", code: "P0001" })).toBe("A B P0001");
  });

  it("shouldRetryStudentLearnQuery never retries RPC failures", () => {
    expect(shouldRetryStudentLearnQuery(0, new StudentLearnRpcError("NO_STUDENT_LINK"))).toBe(false);
    expect(shouldRetryStudentLearnQuery(0, { message: "column a.level_id does not exist" })).toBe(false);
  });
});
