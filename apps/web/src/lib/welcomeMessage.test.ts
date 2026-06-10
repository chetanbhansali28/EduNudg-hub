import { describe, expect, it } from "vitest";
import {
  buildWelcomeHeading,
  buildWelcomeSubtitle,
  firstNameFromDisplayName,
  formatRelativeWhen,
  greetingForHour,
  initialsFromName,
} from "./welcomeMessage";

describe("welcomeMessage", () => {
  it("firstNameFromDisplayName uses first token", () => {
    expect(firstNameFromDisplayName("Priya Sharma")).toBe("Priya");
    expect(firstNameFromDisplayName("Platform Admin")).toBe("Platform");
  });

  it("greetingForHour returns time-of-day prefix", () => {
    expect(greetingForHour(8)).toBe("Good morning");
    expect(greetingForHour(14)).toBe("Good afternoon");
    expect(greetingForHour(20)).toBe("Good evening");
  });

  it("buildWelcomeHeading combines greeting and first name", () => {
    expect(buildWelcomeHeading("Radhika Bhansali", 9)).toBe("Good morning, Radhika 👋");
  });

  it("buildWelcomeSubtitle adds actionable hints", () => {
    expect(buildWelcomeSubtitle("Brand · Smart Brain", [])).toBe("Brand · Smart Brain");
    expect(buildWelcomeSubtitle("Brand · Smart Brain", ["3 leads need attention"])).toBe(
      "Brand · Smart Brain · 3 leads need attention"
    );
  });

  it("initialsFromName returns up to two letters", () => {
    expect(initialsFromName("Radhika Bhansali")).toBe("RB");
  });

  it("formatRelativeWhen shows compact age", () => {
    const now = new Date("2026-06-10T12:00:00Z").getTime();
    expect(formatRelativeWhen("2026-06-10T08:00:00Z", now)).toBe("Today");
    expect(formatRelativeWhen("2026-06-09T08:00:00Z", now)).toBe("Yesterday");
    expect(formatRelativeWhen("2026-06-05T08:00:00Z", now)).toBe("5d ago");
  });
});
