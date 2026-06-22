import { describe, expect, it } from "vitest";
import type { BrandCenterRow } from "@/lib/centerCentersApi";
import {
  centerCounts,
  centerFranchiseId,
  centerListTitle,
  centerLocationLine,
  centerStatsItems,
  centerStatusTone,
  filterCenters,
  programCurriculumSubtitle,
} from "./brandCentersHelpers";

const sample: BrandCenterRow = {
  id: "center-042",
  slug: "koramangala",
  name: "Koramangala 4th Block",
  display_name: "Abacus Koramangala",
  status: "active",
  city: "Bengaluru",
  region: "KA",
  pincode: "560034",
  contact_phone: "+91 9876543210",
  address_line1: null,
  short_description: null,
  country: "IN",
  photo_url: null,
  social_links: [],
};

describe("brandCentersHelpers", () => {
  it("formats list title and location", () => {
    expect(centerListTitle(sample)).toBe("Abacus Koramangala");
    expect(centerLocationLine(sample)).toBe("Bengaluru, KA");
  });

  it("builds franchise id from slug", () => {
    expect(centerFranchiseId(sample)).toBe("EN-KOR-042");
  });

  it("counts and filters centers", () => {
    const centers = [sample, { ...sample, id: "c2", status: "suspended" }];
    expect(centerCounts(centers)).toEqual({ total: 2, active: 1, suspended: 1, all: 2 });
    expect(filterCenters(centers, "suspended")).toHaveLength(1);
  });

  it("maps status tone and stats items", () => {
    expect(centerStatusTone("active")).toBe("active");
    expect(centerStatsItems({ openLeads: 128, students: 540, activeEnrollments: 412 })).toEqual([
      { key: "leads", label: "Open Leads", value: 128 },
      { key: "students", label: "Students", value: 540 },
      { key: "enrollments", label: "Active Enr.", value: 412 },
    ]);
  });

  it("formats program curriculum subtitle", () => {
    expect(programCurriculumSubtitle("Ages 6-12", "Mental arithmetic program")).toBe(
      "Ages 6-12 · Mental arithmetic program"
    );
  });
});
