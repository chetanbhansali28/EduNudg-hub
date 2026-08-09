import { describe, expect, it } from "vitest";
import {
  formatEventDateBadge,
  formatEventScheduleLine,
  isUpcomingEvent,
  resolveVisibleUpcomingEvents,
  upcomingEventsSectionHasContent,
} from "./upcomingEvents";
import type { HomepageUpcomingEventsSection } from "@/types/homepage";

describe("upcomingEvents", () => {
  const section: HomepageUpcomingEventsSection = {
    eyebrow: "UPCOMING EVENTS",
    title: "Events",
    maxItems: 2,
    items: [
      {
        type: "competition",
        title: "Past Olympiad",
        startDate: "2020-01-01",
      },
      {
        type: "workshop",
        title: "Parent workshop",
        startDate: "2099-06-15",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        duration: "2 hours",
      },
      {
        type: "demo",
        title: "Open house",
        startDate: "2099-05-01",
        endDate: "2099-05-02",
      },
      {
        type: "other",
        title: "Extra",
        startDate: "2099-07-01",
      },
    ],
  };

  it("isUpcomingEvent keeps today and future, drops past", () => {
    expect(isUpcomingEvent({ type: "other", title: "x", startDate: "2020-01-01" }, "2026-08-09")).toBe(
      false
    );
    expect(isUpcomingEvent({ type: "other", title: "x", startDate: "2026-08-09" }, "2026-08-09")).toBe(true);
    expect(
      isUpcomingEvent(
        { type: "other", title: "x", startDate: "2026-08-01", endDate: "2026-08-10" },
        "2026-08-09"
      )
    ).toBe(true);
  });

  it("regression_resolveVisibleUpcomingEventsFiltersSortsAndCaps", () => {
    const visible = resolveVisibleUpcomingEvents(section, "2026-08-09");
    expect(visible.map((e) => e.title)).toEqual(["Open house", "Parent workshop"]);
    expect(upcomingEventsSectionHasContent(section, "2026-08-09")).toBe(true);
    expect(upcomingEventsSectionHasContent({ ...section, items: [] }, "2026-08-09")).toBe(false);
  });

  it("formats date badge and schedule line", () => {
    expect(formatEventDateBadge("2099-06-15")).toEqual({ month: "JUN", day: "15" });
    expect(
      formatEventScheduleLine({
        type: "workshop",
        title: "x",
        startDate: "2099-06-15",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        duration: "2 hours",
      })
    ).toBe("10:00 AM – 12:00 PM · 2 hours");
  });
});
