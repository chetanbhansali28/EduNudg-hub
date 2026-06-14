import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LearningPathTimeline } from "./LearningPathTimeline";

const mockLadders = [
  {
    program_id: "p1",
    program_name: "Abacus Core",
    batches: [],
    curriculum_ladder: {
      current_level_id: "l2",
      completion_pct: 50,
      levels: [
        {
          level_id: "l1",
          name: "Level 1",
          sort_order: 1,
          status: "completed",
          completed_at: "2026-01-15",
          abacus_level_code: "L1",
        },
        {
          level_id: "l2",
          name: "Level 2",
          sort_order: 2,
          status: "in_progress",
          completed_at: null,
          abacus_level_code: "L2",
        },
        {
          level_id: "l3",
          name: "Level 3",
          sort_order: 3,
          status: "not_started",
          completed_at: null,
          abacus_level_code: "L3",
        },
      ],
    },
    assessments: [],
  },
];

describe("LearningPathTimeline", () => {
  it("regression_renders_vertical_timeline_with_current_badge", () => {
    render(
      <MemoryRouter>
        <LearningPathTimeline ladders={mockLadders} />
      </MemoryRouter>
    );

    expect(screen.getByText("Current")).toBeDefined();
    expect(screen.getByText("Level 2: Level 2")).toBeDefined();
    expect(document.querySelector(".ed-sp-timeline")).toBeTruthy();
  });
});
