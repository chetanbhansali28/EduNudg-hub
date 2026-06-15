import { describe, expect, it } from "vitest";
import type { CenterBatchRow } from "@/lib/centerBatchesApi";
import {
  buildDashboardActionItems,
  buildDashboardBatchCard,
  countBatchesToday,
  findNextBatchTimeLabel,
  formatBatchTimeRange,
  formatDashboardDate,
  getBatchSessionStatus,
  isBatchScheduledToday,
  parseBatchSchedule,
  sortDashboardBatches,
} from "@/lib/centerDashboardHelpers";

const sampleBatch = (overrides: Partial<CenterBatchRow> = {}): CenterBatchRow => ({
  id: "batch-1",
  name: "Robotics 101",
  is_open_for_enrollment: true,
  program_id: "prog-1",
  level_start_id: "lvl-1",
  level_end_id: "lvl-2",
  schedule: {
    days: ["tuesday"],
    start_time: "10:30",
    end_time: "12:00",
    room: "Room 402",
    max_students: 15,
  },
  programs: { name: "Robotics" },
  level_start: { name: "L1" },
  level_end: { name: "L3" },
  ...overrides,
});

describe("centerDashboardHelpers", () => {
  it("formatDashboardDate uppercases weekday and month", () => {
    const label = formatDashboardDate(new Date(2024, 9, 22, 12, 0, 0));
    expect(label).toContain("TUESDAY");
    expect(label).toContain("OCT");
    expect(label).toContain("22");
  });

  it("parseBatchSchedule reads schedule fields", () => {
    expect(
      parseBatchSchedule({
        days: ["monday"],
        start_time: "09:00",
        end_time: "10:00",
        room: "Lab 1",
        max_students: 20,
      })
    ).toEqual({
      days: ["monday"],
      start_time: "09:00",
      end_time: "10:00",
      room: "Lab 1",
      max_students: 20,
    });
  });

  it("isBatchScheduledToday matches weekday", () => {
    const tuesday = new Date(2024, 9, 22, 9, 0, 0);
    expect(isBatchScheduledToday(parseBatchSchedule({ days: ["tuesday"] }), tuesday)).toBe(true);
    expect(isBatchScheduledToday(parseBatchSchedule({ days: ["monday"] }), tuesday)).toBe(false);
    expect(isBatchScheduledToday(parseBatchSchedule({}), tuesday)).toBe(true);
  });

  it("getBatchSessionStatus marks live and upcoming windows", () => {
    const liveNow = new Date(2024, 9, 22, 11, 0, 0);
    expect(getBatchSessionStatus(parseBatchSchedule(sampleBatch().schedule), liveNow)).toEqual({
      status: "live",
      statusLabel: "LIVE NOW",
    });

    const upcoming = new Date(2024, 9, 22, 9, 0, 0);
    expect(getBatchSessionStatus(parseBatchSchedule(sampleBatch().schedule), upcoming).status).toBe("upcoming");
  });

  it("formatBatchTimeRange renders AM/PM range", () => {
    expect(formatBatchTimeRange(parseBatchSchedule(sampleBatch().schedule))).toBe("10:30 AM - 12:00 PM");
  });

  it("buildDashboardBatchCard maps enrollment and capacity", () => {
    const card = buildDashboardBatchCard(sampleBatch(), 12, new Date(2024, 9, 22, 11, 0, 0));
    expect(card.name).toBe("Robotics 101");
    expect(card.location).toBe("Room 402");
    expect(card.enrolledStudents).toBe(12);
    expect(card.capacity).toBe(15);
    expect(card.progressPercent).toBe(80);
    expect(card.status).toBe("live");
  });

  it("sortDashboardBatches prioritizes live then upcoming", () => {
    const live = buildDashboardBatchCard(sampleBatch({ id: "live", name: "Live Batch" }), 5, new Date(2024, 9, 22, 11, 0, 0));
    const upcoming = buildDashboardBatchCard(
      sampleBatch({
        id: "upcoming",
        name: "Upcoming Batch",
        schedule: { days: ["tuesday"], start_time: "14:00", end_time: "15:00" },
      }),
      3,
      new Date(2024, 9, 22, 9, 0, 0)
    );
    const sorted = sortDashboardBatches([upcoming, live]);
    expect(sorted[0].id).toBe("live");
    expect(sorted[1].id).toBe("upcoming");
  });

  it("countBatchesToday and findNextBatchTimeLabel use schedule", () => {
    const now = new Date(2024, 9, 22, 9, 0, 0);
    const batches = [
      sampleBatch(),
      sampleBatch({
        id: "batch-2",
        schedule: { days: ["monday"], start_time: "14:00", end_time: "15:00" },
      }),
    ];
    expect(countBatchesToday(batches, now)).toBe(1);
    expect(findNextBatchTimeLabel(batches, now)).toBe("10:30 AM");
  });

  it("buildDashboardActionItems caps at four prioritized items", () => {
    const items = buildDashboardActionItems({
      qualifiedLeadName: "Mihir Shah",
      overdueInvoiceCount: 3,
      overdueBatchName: "Data Science A",
      lowStockItems: 2,
      unseenBatchJoins: 1,
    });
    expect(items).toHaveLength(4);
    expect(items[0].title).toBe("Follow up on Lead");
    expect(items[1].title).toBe("Pending Fee Reminder");
  });
});
