import { describe, expect, it, vi, beforeEach } from "vitest";
import { createCenterInvoice, recordCenterPayment } from "./centerFeesApi";

const insert = vi.fn();
const select = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const single = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => {
      if (table === "invoices") {
        return {
          insert: (...args: unknown[]) => {
            insert(...args);
            return { select: () => ({ single }) };
          },
          select: () => ({ eq: () => ({ eq: () => ({ single }) }) }),
          update: (...args: unknown[]) => {
            update(...args);
            return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) };
          },
        };
      }
      if (table === "payments") {
        return {
          insert: (...args: unknown[]) => {
            insert(...args);
            return Promise.resolve({ error: null });
          },
          select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: [{ amount_cents: 100000 }], error: null }) }) }),
        };
      }
      return { select, eq };
    },
  }),
}));

describe("centerFeesApi", () => {
  beforeEach(() => {
    insert.mockClear();
    update.mockClear();
    single.mockReset();
  });

  it("createCenterInvoice inserts invoice row", async () => {
    single.mockResolvedValue({ data: { id: "inv-1" }, error: null });

    const id = await createCenterInvoice({
      brandId: "brand-1",
      centerId: "center-1",
      studentId: "student-1",
      amountCents: 250000,
      invoiceNumber: " INV-001 ",
      status: "sent",
      dueAt: "2026-07-01T00:00:00Z",
    });

    expect(id).toBe("inv-1");
    expect(insert).toHaveBeenCalled();
  });

  it("regression_recordCenterPayment_updates_invoice_status", async () => {
    single.mockResolvedValue({ data: { amount_cents: 100000, status: "sent" }, error: null });

    await recordCenterPayment({
      brandId: "brand-1",
      centerId: "center-1",
      invoiceId: "inv-1",
      amountCents: 100000,
      method: "upi",
    });

    expect(insert).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ status: "paid" });
  });
});
