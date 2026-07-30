import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPlatformDashboardHome } from "./platformDashboardApi";

type QueryRecord = {
  table: string;
  columns: string;
  eq: [string, unknown][];
};

const queries: QueryRecord[] = [];
let errorByTable: Record<string, { message: string; code?: string } | null> = {};

const SIGNUP_ROWS = [
  {
    id: "signup-1",
    requested_name: "Abacus World",
    created_at: "2026-06-20T10:00:00Z",
    status: "approved",
  },
];

function rowsFor(table: string): unknown[] {
  return table === "platform_brand_signups" ? SIGNUP_ROWS : [];
}

function createBuilder(table: string) {
  const record: QueryRecord = { table, columns: "", eq: [] };
  queries.push(record);

  const result = {
    data: errorByTable[table] ? null : rowsFor(table),
    error: errorByTable[table] ?? null,
    count: 0,
  };
  const builder = {
    select(columns: string) {
      record.columns = columns;
      return builder;
    },
    eq(column: string, value: unknown) {
      record.eq.push([column, value]);
      return builder;
    },
    is: () => builder,
    gte: () => builder,
    lt: () => builder,
    order: () => builder,
    limit: () => builder,
    then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: (table: string) => createBuilder(table) }),
}));

function signupQueries(): QueryRecord[] {
  return queries.filter((query) => query.table === "platform_brand_signups");
}

describe("platformDashboardApi", () => {
  beforeEach(() => {
    queries.length = 0;
    errorByTable = {};
  });

  it("critical_signup_queries_select_requested_name_not_brand_name", async () => {
    await fetchPlatformDashboardHome(new Date("2026-06-22T12:00:00Z"));

    const signups = signupQueries();
    expect(signups).toHaveLength(2);
    for (const query of signups) {
      expect(query.columns).toContain("requested_name");
      expect(query.columns).not.toContain("brand_name");
    }
  });

  it("regression_converted_signups_filter_uses_approved_status", async () => {
    await fetchPlatformDashboardHome(new Date("2026-06-22T12:00:00Z"));

    const statusFilters = signupQueries().flatMap((query) =>
      query.eq.filter(([column]) => column === "status").map(([, value]) => value)
    );
    expect(statusFilters).toEqual(["approved"]);
  });

  it("renders signup activity from the requested name", async () => {
    const home = await fetchPlatformDashboardHome(new Date("2026-06-22T12:00:00Z"));

    expect(home.enterpriseLeadsConverted).toBe(1);
    expect(home.activities.map((activity) => activity.description)).toContain(
      "Abacus World submitted a platform signup."
    );
  });

  it("critical_throws_when_signup_query_returns_postgrest_error", async () => {
    errorByTable = {
      platform_brand_signups: {
        message: "column platform_brand_signups.brand_name does not exist",
        code: "42703",
      },
    };

    await expect(fetchPlatformDashboardHome(new Date("2026-06-22T12:00:00Z"))).rejects.toMatchObject({
      message: "column platform_brand_signups.brand_name does not exist",
    });
  });
});
