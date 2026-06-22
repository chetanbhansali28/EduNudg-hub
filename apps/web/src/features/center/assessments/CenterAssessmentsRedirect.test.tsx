import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CenterAssessmentsRedirect } from "./CenterAssessmentsRedirect";

describe("CenterAssessmentsRedirect", () => {
  it("regression_assessments_route_redirects_to_students_tab", () => {
    render(
      <MemoryRouter initialEntries={["/app/assessments"]}>
        <Routes>
          <Route path="/app/assessments" element={<CenterAssessmentsRedirect />} />
          <Route path="/app/students" element={<div>Students hub</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Students hub")).toBeDefined();
  });

  it("regression_preserves_student_id_in_redirect", () => {
    render(
      <MemoryRouter initialEntries={["/app/assessments?studentId=s1"]}>
        <Routes>
          <Route path="/app/assessments" element={<CenterAssessmentsRedirect />} />
          <Route path="/app/students" element={<div>Students hub</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Students hub")).toBeDefined();
  });
});
