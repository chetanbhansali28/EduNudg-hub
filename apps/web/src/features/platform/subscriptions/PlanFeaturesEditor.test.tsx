import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlanFeaturesEditor } from "./PlanFeaturesEditor";
import { emptyPlanFeaturesForm } from "@/lib/subscriptionPlanFeatures";

describe("PlanFeaturesEditor", () => {
  it("renders boolean features as toggle switches in a grid", () => {
    const onChange = vi.fn();
    render(<PlanFeaturesEditor values={emptyPlanFeaturesForm()} onChange={onChange} />);

    expect(document.querySelector(".ed-toggle-grid")).toBeTruthy();
    expect(screen.getAllByRole("switch").length).toBeGreaterThan(5);

    const whiteLabel = screen.getByRole("switch", { name: "White-label branding" });
    fireEvent.click(whiteLabel);
    expect(onChange).toHaveBeenCalledWith("white_labeling", "true");
  });
});
