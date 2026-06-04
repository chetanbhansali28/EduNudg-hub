import { beforeEach, describe, expect, it, vi } from "vitest";
import { slugifyBrandName, uniqueBrandSlug } from "./brandSlug";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock }),
}));

function slugQuery(existing: boolean) {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    neq: vi.fn(() => c),
    is: vi.fn(() => c),
    maybeSingle: vi.fn(() => Promise.resolve({ data: existing ? { id: "taken" } : null, error: null })),
  };
  return c;
}

describe("brandSlug", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("slugifyBrandName normalizes display names", () => {
    expect(slugifyBrandName("  Abacus World!  ")).toBe("abacus-world");
  });

  it("uniqueBrandSlug returns base when unused", async () => {
    fromMock.mockReturnValue(slugQuery(false));
    await expect(uniqueBrandSlug("Abacus World")).resolves.toBe("abacus-world");
  });

  it("uniqueBrandSlug appends suffix on collision", async () => {
    fromMock
      .mockReturnValueOnce(slugQuery(true))
      .mockReturnValueOnce(slugQuery(false));
    await expect(uniqueBrandSlug("Abacus World")).resolves.toBe("abacus-world-2");
  });
});
