import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BrandStudentDetailPanel } from "./BrandStudentDetailPanel";
import type { BrandStudentRow } from "@/lib/brandStudentsApi";
import { exactAccessibleName } from "@/test/exactAccessibleName";

const student: BrandStudentRow = {
  id: "s1",
  enrollment_id: "e1",
  full_name: "Meera Sharma",
  student_code: "SBA-101",
  login_email: "meera@example.com",
  user_id: "u1",
  date_of_birth: "2014-05-12",
  photo_url: null,
  enrollment_status: "active",
  enrollment_created_at: "2026-01-10T00:00:00Z",
  program_id: "p1",
  program_name: "Abacus Core",
  starting_level_id: "l1",
  starting_level_name: "Level 1",
  current_level_id: "l2",
  current_level_name: "Level 2",
  levels: [
    {
      level_id: "l1",
      name: "Level 1",
      sort_order: 1,
      status: "completed",
      abacus_level_code: "L1",
      is_current: false,
    },
    {
      level_id: "l2",
      name: "Level 2",
      sort_order: 2,
      status: "in_progress",
      abacus_level_code: "L2",
      is_current: true,
    },
  ],
  center_id: "c1",
  center_slug: "koramangala",
  center_name: "Abacus Koramangala",
  center_city: "Bengaluru",
  phone: "+919876543210",
  address_line1: "12 Main St",
  city: "Bengaluru",
  state: "KA",
  pincode: "560034",
  school_name: "Oakridge",
  parent_name: "Anita Sharma",
  parent_email: "anita@example.com",
  parent_phone: "+919900011111",
  batch_names: ["Morning A"],
};

describe("BrandStudentDetailPanel", () => {
  it("shows contact, franchise, and curriculum level progress", () => {
    render(
      <MemoryRouter>
        <BrandStudentDetailPanel student={student} isMobile={false} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Meera Sharma" })).toBeDefined();
    expect(screen.getByText("Student ID: SBA-101")).toBeDefined();
    expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    expect((screen.getByLabelText(exactAccessibleName("Login email")) as HTMLInputElement).value).toBe(
      "meera@example.com"
    );
    expect((screen.getByLabelText(exactAccessibleName("School")) as HTMLInputElement).value).toBe("Oakridge");
    expect((screen.getByLabelText(exactAccessibleName("Current level")) as HTMLInputElement).value).toBe("Level 2");
    expect(screen.getByText("Level 1 (L1)")).toBeDefined();
    expect(screen.getByText("Completed")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Copy Profile URL" })).toBeNull();
  });
});
