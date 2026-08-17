import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  allocateStudentMerchandise,
  createCenterMerchandiseOrder,
  deleteMerchandiseCatalogItem,
  listActiveMerchandiseCatalog,
  recordMerchandisePayment,
  updateMerchandiseOrderStatus,
} from "./merchandiseOrdersApi";

const rpc = vi.fn();
const from = vi.fn();
const removeAllPhotos = vi.fn();

vi.mock("@/lib/merchandiseProductPhotoStorage", () => ({
  removeAllMerchandiseProductPhotos: (...args: unknown[]) => removeAllPhotos(...args),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from }),
}));

describe("merchandiseOrdersApi", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
    removeAllPhotos.mockReset();
    removeAllPhotos.mockResolvedValue(undefined);
  });

  it("regression_update_merchandise_order_status", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await updateMerchandiseOrderStatus("order-1", "approved");
    expect(rpc).toHaveBeenCalledWith("update_merchandise_order_status_rpc", {
      p_order_id: "order-1",
      p_status: "approved",
      p_shipping_tracking: null,
    });
  });

  it("regression_allocate_student_merchandise", async () => {
    rpc.mockResolvedValue({ data: "alloc-1", error: null });
    const id = await allocateStudentMerchandise("center-1", "student-1", "line-1");
    expect(id).toBe("alloc-1");
    expect(rpc).toHaveBeenCalledWith("allocate_student_merchandise", {
      p_center_id: "center-1",
      p_student_id: "student-1",
      p_order_line_id: "line-1",
    });
  });

  it("regression_create_center_merchandise_order", async () => {
    rpc.mockResolvedValue({ data: "order-1", error: null });
    const id = await createCenterMerchandiseOrder("brand-1", "center-1", {
      lines: [{ catalogItemId: "cat-1", quantity: 2, unitPriceCents: 50000 }],
      shippingMode: "franchise",
      shippingAddress: { name: "Center" },
      paymentMethod: "invoice",
    });
    expect(id).toBe("order-1");
    expect(rpc).toHaveBeenCalledWith("create_center_merchandise_order_rpc", expect.objectContaining({
      p_brand_id: "brand-1",
      p_center_id: "center-1",
      p_payment_method: "invoice",
    }));
  });

  it("regression_brand_mark_invoice_paid_enables_approval", async () => {
    rpc.mockResolvedValue({ data: "pay-1", error: null });
    await recordMerchandisePayment("order-1", 100000, "manual", "Bank ref 123");
    expect(rpc).toHaveBeenCalledWith("record_merchandise_payment", {
      p_order_id: "order-1",
      p_amount_cents: 100000,
      p_method: "manual",
      p_reference_notes: "Bank ref 123",
    });
  });

  it("regression_delete_merchandise_catalog_item_removes_storage_photos", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await deleteMerchandiseCatalogItem("brand-1", "item-1");
    expect(removeAllPhotos).toHaveBeenCalledWith("brand-1", "item-1");
    expect(rpc).toHaveBeenCalledWith("delete_merchandise_catalog_item", {
      p_brand_id: "brand-1",
      p_id: "item-1",
    });
  });

  it("regression_upsert_merchandise_catalog_syncs_curriculum_links", async () => {
    rpc.mockResolvedValue({ data: "item-1", error: null });
    const { upsertMerchandiseCatalogItem } = await import("./merchandiseOrdersApi");
    await upsertMerchandiseCatalogItem("brand-1", {
      sku: "KIT001",
      name: "Level 1 Kit",
      priceCents: 105000,
      programIds: ["prog-1"],
    });
    expect(rpc).toHaveBeenCalledWith(
      "upsert_merchandise_catalog_item",
      expect.objectContaining({ p_brand_id: "brand-1", p_sku: "KIT001" })
    );
    expect(rpc).toHaveBeenCalledWith("sync_merchandise_catalog_programs", {
      p_brand_id: "brand-1",
      p_catalog_item_id: "item-1",
      p_links: [{ program_id: "prog-1", level_id: null }],
    });
  });

  it("regression_list_merchandise_catalog_maps_curriculum_links", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "item-1",
          sku: "KIT001",
          name: "Level 1 Kit",
          price_cents: 105000,
          currency: "INR",
          is_active: true,
          photo_urls: [],
          merchandise_catalog_programs: [
            {
              program_id: "prog-1",
              level_id: "lvl-1",
              programs: { id: "prog-1", name: "Abacus Core" },
              levels: { id: "lvl-1", name: "Level 1" },
            },
          ],
        },
      ],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    from.mockReturnValue({ select });
    const { listMerchandiseCatalog } = await import("./merchandiseOrdersApi");
    const rows = await listMerchandiseCatalog("brand-1");
    expect(select).toHaveBeenCalledWith(expect.stringContaining("merchandise_catalog_programs"));
    expect(rows[0]?.programIds).toEqual(["prog-1"]);
    expect(rows[0]?.programNames).toEqual(["Abacus Core · Level 1"]);
    expect(rows[0]?.curriculumLinks).toEqual([{ programId: "prog-1", levelId: "lvl-1" }]);
  });

  it("regression_list_active_merchandise_catalog_includes_photo_urls", async () => {
    const eq = vi.fn();
    const order = vi.fn();
    const select = vi.fn(() => ({ eq }));
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({ order });
    order.mockResolvedValue({
      data: [{ id: "item-1", sku: "A", name: "Kit", price_cents: 100, currency: "INR", photo_urls: ["https://x/1.jpg"] }],
      error: null,
    });
    from.mockReturnValue({ select });

    const rows = await listActiveMerchandiseCatalog("brand-1");
    expect(select).toHaveBeenCalledWith("id, sku, name, price_cents, currency, photo_urls");
    expect(rows[0]?.photo_urls).toEqual(["https://x/1.jpg"]);
    expect(rows[0]?.courseNames).toEqual([]);
    expect(rows[0]?.levelNames).toEqual([]);
    expect(rows[0]?.programIds).toEqual([]);
  });

  it("regression_list_active_merchandise_catalog_filters_by_center_curriculum", async () => {
    rpc.mockResolvedValue({
      data: [{ id: "item-1", sku: "A", name: "Kit", price_cents: 100, currency: "INR", photo_urls: [] }],
      error: null,
    });
    const inQuery = vi.fn().mockResolvedValue({
      data: [
        {
          catalog_item_id: "item-1",
          program_id: "prog-1",
          level_id: "lvl-1",
          programs: { id: "prog-1", name: "Abacus Core" },
          levels: { id: "lvl-1", name: "Level 1" },
        },
      ],
      error: null,
    });
    from.mockImplementation((table: string) => {
      if (table === "merchandise_catalog_programs") {
        return { select: vi.fn(() => ({ in: inQuery })) };
      }
      throw new Error(`unexpected table ${table}`);
    });
    const { listActiveMerchandiseCatalog: listActive } = await import("./merchandiseOrdersApi");
    const rows = await listActive("brand-1", "center-1");
    expect(rpc).toHaveBeenCalledWith("list_center_active_merchandise_catalog", {
      p_center_id: "center-1",
    });
    expect(from).toHaveBeenCalledWith("merchandise_catalog_programs");
    expect(inQuery).toHaveBeenCalledWith("catalog_item_id", ["item-1"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "item-1",
      courseNames: ["Abacus Core"],
      levelNames: ["Level 1"],
      programIds: ["prog-1"],
    });
  });

  it("regression_list_active_catalog_falls_back_when_rpc_price_type_mismatches", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42804",
        message: "Returned type bigint does not match expected type integer in column 4",
      },
    });
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "item-1",
          sku: "A",
          name: "Kit",
          price_cents: 105000,
          currency: "INR",
          is_active: true,
          photo_urls: [],
          merchandise_catalog_programs: [
            { program_id: "prog-1", programs: { id: "prog-1", name: "Abacus Core" } },
          ],
        },
      ],
      error: null,
    });
    const catalogEqIsActive = vi.fn(() => ({ order }));
    const catalogEqBrand = vi.fn(() => ({ eq: catalogEqIsActive }));
    from.mockImplementation((table: string) => {
      if (table === "center_program_enablement") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  center_id: "center-1",
                  program_id: "prog-1",
                  authorized_at: "2026-01-01T00:00:00Z",
                  programs: { name: "Abacus Core" },
                },
              ],
              error: null,
            }),
          })),
        };
      }
      return {
        select: vi.fn(() => ({ eq: catalogEqBrand })),
      };
    });
    const { listActiveMerchandiseCatalog: listActive } = await import("./merchandiseOrdersApi");
    const rows = await listActive("brand-1", "center-1");
    expect(rows).toEqual([
      expect.objectContaining({
        id: "item-1",
        sku: "A",
        price_cents: 105000,
        programIds: ["prog-1"],
        courseNames: ["Abacus Core"],
        levelNames: [],
      }),
    ]);
  });
});
