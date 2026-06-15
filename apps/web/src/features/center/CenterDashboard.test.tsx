import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CenterDashboard } from "./CenterDashboard";
import { CenterDashboardView } from "./dashboard/CenterDashboardView";
import type { CenterDashboardHome } from "@/lib/centerDashboardHomeApi";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    centerId: "center-1",
  }),
}));

const sampleHome: CenterDashboardHome = {
  openLeads: 5,
  leadsToday: 2,
  batchesToday: 3,
  nextBatchTime: "10:30 AM",
  pendingFeesCents: 120000,
  overdueInvoiceCount: 3,
  batches: [
    {
      id: "batch-1",
      name: "Robotics 101",
      programName: "Robotics",
      location: "Room 402",
      timeRange: "10:30 AM - 12:00 PM",
      status: "live",
      statusLabel: "LIVE NOW",
      enrolledStudents: 12,
      capacity: 15,
      progressPercent: 80,
      accent: "teal",
    },
    {
      id: "batch-2",
      name: "Data Science A",
      programName: "Data Science",
      location: "Lab 1",
      timeRange: "2:00 PM - 3:30 PM",
      status: "upcoming",
      statusLabel: "STARTS IN 2H",
      enrolledStudents: 18,
      capacity: 20,
      progressPercent: 90,
      accent: "purple",
    },
  ],
  actionItems: [
    {
      id: "lead-follow-up",
      title: "Follow up on Lead",
      subtitle: "Mihir Shah expressed interest.",
      href: "/app/leads",
      tone: "purple",
      kind: "lead",
    },
    {
      id: "fee-reminder",
      title: "Pending Fee Reminder",
      subtitle: "3 students from Data Science A.",
      href: "/app/fees",
      tone: "red",
      kind: "fee",
    },
    {
      id: "curriculum",
      title: "Update Curriculum",
      subtitle: "Review programs and levels for your center.",
      href: "/app/curriculum",
      tone: "pink",
      kind: "curriculum",
    },
    {
      id: "batch-joins",
      title: "Review batch joins",
      subtitle: "1 new student joined a batch.",
      href: "/app/batches",
      tone: "blue",
      kind: "batch",
    },
  ],
};

vi.mock("@/lib/centerDashboardHomeApi", () => ({
  fetchCenterDashboardHome: () => Promise.resolve(sampleHome),
}));

describe("CenterDashboard", () => {
  it("regression_center_home_schedule_dashboard", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <CenterDashboard />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Today's Schedule")).toBeDefined();
    expect(screen.getByText("Open Leads")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("Live & Upcoming Batches")).toBeDefined();
    expect(screen.getByText("Robotics 101")).toBeDefined();
    expect(screen.getByText("Action Items")).toBeDefined();
    expect(screen.getByText("Follow up on Lead")).toBeDefined();
    expect(screen.getByText("All servers operational")).toBeDefined();
  });
});

describe("CenterDashboardView", () => {
  it("renders desktop schedule sections from payload", () => {
    render(
      <MemoryRouter>
        <CenterDashboardView data={sampleHome} dateLabel="TUESDAY, OCT 24" />
      </MemoryRouter>
    );

    expect(screen.getByText("TUESDAY, OCT 24")).toBeDefined();
    expect(screen.getByText("+2 today")).toBeDefined();
    expect(screen.getByText("Next: 10:30 AM")).toBeDefined();
    expect(screen.getByText("3 Overdue")).toBeDefined();
    expect(screen.getByText("Data Science A")).toBeDefined();
    expect(screen.getByRole("link", { name: "View All" }).getAttribute("href")).toBe("/app/batches");
  });
});
