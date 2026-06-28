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
});
