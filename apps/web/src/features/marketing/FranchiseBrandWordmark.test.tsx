import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FranchiseBrandWordmark } from "./FranchiseBrandWordmark";

describe("FranchiseBrandWordmark", () => {
  it("regression_franchise_wordmark_shows_center_then_by_brand", () => {
    render(<FranchiseBrandWordmark siteName="Rathi Educon" brandName="Smart Brain" />);
    expect(screen.getByLabelText("Rathi Educon by Smart Brain")).toBeTruthy();
    expect(screen.getByText("Rathi Educon")).toBeTruthy();
    expect(screen.getByText("by Smart Brain")).toBeTruthy();
  });

  it("regression_franchise_wordmark_omits_byline_when_names_match", () => {
    render(<FranchiseBrandWordmark siteName="Smart Brain" brandName="Smart Brain" />);
    expect(screen.getByText("Smart Brain")).toBeTruthy();
    expect(screen.queryByText("by Smart Brain")).toBeNull();
  });
});
