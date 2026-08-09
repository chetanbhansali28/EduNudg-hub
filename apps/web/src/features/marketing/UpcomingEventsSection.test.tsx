import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UpcomingEventsSection } from "./UpcomingEventsSection";
import type { HomepageUpcomingEventsSection } from "@/types/homepage";

describe("UpcomingEventsSection", () => {
  const section: HomepageUpcomingEventsSection = {
    eyebrow: "UPCOMING EVENTS",
    title: "Competitions, workshops & demos",
    subtitle: "What’s next",
    items: [],
  };

  it("regression_rendersUpcomingEventCardsWithOptionalImage", () => {
    render(
      <MemoryRouter>
        <UpcomingEventsSection
          section={section}
          events={[
            {
              type: "competition",
              title: "National Abacus Olympiad",
              startDate: "2099-04-18",
              location: "Pune",
              startTime: "9:00 AM",
              duration: "Full day",
              imageUrl: "https://example.com/event.jpg",
              ctaLabel: "Register",
              ctaHref: "#faq",
            },
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("upcoming-events")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Competitions, workshops & demos" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "National Abacus Olympiad" })).toBeDefined();
    expect(screen.getByText("Competition")).toBeDefined();
    expect(screen.getByText("Pune")).toBeDefined();
    expect(screen.getByText("9:00 AM · Full day")).toBeDefined();
    expect(document.querySelector(".mkt-events__image")).toBeTruthy();
  });

  it("returns null when events list empty", () => {
    const { container } = render(
      <MemoryRouter>
        <UpcomingEventsSection section={section} events={[]} />
      </MemoryRouter>
    );
    expect(container.querySelector("[data-testid='upcoming-events']")).toBeNull();
  });
});
