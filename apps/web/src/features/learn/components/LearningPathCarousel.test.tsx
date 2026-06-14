import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningPathCarousel } from "./LearningPathCarousel";

const mockLadder = {
  program_id: "p1",
  program_name: "Abacus Core",
  batches: [{ batch_id: "b1", batch_name: "Morning", level_start: "L1", level_end: "L3" }],
  curriculum_ladder: {
    current_level_id: "l2",
    completion_pct: 25,
    levels: [
      { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", completed_at: null, abacus_level_code: "L1" },
      { level_id: "l2", name: "Level 2", sort_order: 2, status: "in_progress", completed_at: null, abacus_level_code: "L2" },
      { level_id: "l3", name: "Level 3", sort_order: 3, status: "not_started", completed_at: null, abacus_level_code: "L3" },
    ],
  },
  assessments: [],
};

describe("LearningPathCarousel", () => {
  it("regression_renders_program_and_level_cards", () => {
    render(<LearningPathCarousel ladders={[mockLadder]} />);

    expect(screen.getByText("Current program")).toBeDefined();
    expect(screen.getAllByText("Abacus Core").length).toBeGreaterThan(0);
    expect(screen.getByText("Level 2")).toBeDefined();
    expect(screen.getByText("Level 3")).toBeDefined();
  });
});
