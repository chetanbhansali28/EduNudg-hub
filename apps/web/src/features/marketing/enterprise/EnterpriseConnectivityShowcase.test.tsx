import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { EnterpriseConnectivityShowcase } from "./EnterpriseConnectivityShowcase";

vi.mock("../MarketingBackgroundMedia", () => ({
  MarketingBackgroundMedia: () => <div data-testid="connectivity-phone" />,
}));

describe("EnterpriseConnectivityShowcase", () => {
  it("regression_renders_all_connectivity_cards_without_position_holes", () => {
    const showcase = DEFAULT_HOMEPAGE_CONFIG.connectivityShowcase!;
    render(<EnterpriseConnectivityShowcase showcase={showcase} />);

    for (const card of showcase.cards) {
      expect(screen.getByRole("heading", { name: card.title })).toBeDefined();
    }

    expect(document.querySelector(".ent-connectivity__stage")).toBeNull();
    expect(document.querySelector(".ent-connectivity__layout")).toBeTruthy();
    expect(document.querySelectorAll(".ent-connectivity__card")).toHaveLength(showcase.cards.length);
  });

  it("regression_falls_back_to_hero_phone_frame_when_center_image_missing", () => {
    const showcase = {
      ...DEFAULT_HOMEPAGE_CONFIG.connectivityShowcase!,
      centerImageUrl: undefined,
    };
    render(
      <EnterpriseConnectivityShowcase
        showcase={showcase}
        fallbackCenterImage="https://cdn.example.com/legacy-phone.png"
      />
    );

    expect(screen.getByTestId("connectivity-phone")).toBeDefined();
  });

  it("regression_family_journey_connectivity_copy", () => {
    const showcase = DEFAULT_HOMEPAGE_CONFIG.connectivityShowcase!;
    render(<EnterpriseConnectivityShowcase showcase={showcase} />);

    expect(screen.getByRole("heading", { name: "From trial class to proud parent" })).toBeDefined();
    expect(screen.getByText(/Enrollment, progress, and communication stay connected/i)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Easy enroll" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Stay close" })).toBeDefined();
    expect(showcase.cards).toHaveLength(4);
  });
});
