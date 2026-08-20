import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EduLearnMentors } from "./EduLearnMentors";

describe("EduLearnMentors", () => {
  it("regression_edu_learn_mentor_card_shows_role_badge_and_title", () => {
    render(
      <EduLearnMentors
        founders={[
          {
            roleBadge: "FOUNDER & CEO",
            name: "Bhavana Soni",
            title: "Smart Brain Abacus Education Pvt. Ltd.",
            bio: "Share your story.",
            photoUrl: "",
          },
        ]}
      />
    );

    expect(screen.getByText("FOUNDER & CEO")).toBeDefined();
    expect(screen.getByText("Bhavana Soni")).toBeDefined();
    expect(screen.getByText("Smart Brain Abacus Education Pvt. Ltd.")).toBeDefined();
    expect(document.getElementById("founders")).toBeTruthy();
    expect(document.querySelector(".el-mentor-card__badge")).toBeDefined();
  });
});
