import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchJoinCarousel } from "./BatchJoinCarousel";

describe("BatchJoinCarousel", () => {
  it("regression_joined_batch_shows_enrolled_state", () => {
    render(
      <BatchJoinCarousel
        batches={[
          {
            batch_id: "b1",
            name: "Morning batch",
            program_name: "Abacus Core",
            level_start: "Level 1",
            level_end: "Level 3",
            already_joined: true,
          },
          {
            batch_id: "b2",
            name: "Evening batch",
            program_name: "Abacus Core",
            level_start: "Level 4",
            level_end: "Level 6",
            already_joined: false,
          },
        ]}
        joinPending={false}
        onJoin={vi.fn()}
      />
    );

    expect(screen.getByText("Enrolled")).toBeDefined();
    expect(screen.getByRole("button", { name: "Join now" })).toBeDefined();
    expect(document.querySelector(".ed-sp-batch-card--joined")).toBeTruthy();
  });
});
