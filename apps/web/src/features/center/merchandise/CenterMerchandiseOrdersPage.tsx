import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import {
  createCenterMerchandiseOrder,
  listActiveMerchandiseCatalog,
  listCenterMerchandiseOrders,
  markMerchandiseOrderReceived,
  validateMerchandisePromoCode,
  type MerchandiseOrderRow,
  type MerchandisePaymentMethod,
  type MerchandiseShippingMode,
} from "@/lib/merchandiseOrdersApi";
import { listCenterMerchandisePaymentAlerts } from "@/lib/merchandiseRemindersApi";
import { fetchMerchandiseBrandSettings } from "@/lib/merchandiseSettingsApi";
import {
  isShippingAddressComplete,
  resolveFranchiseAddress,
  resolveStudentAddress,
  snapshotCustomAddress,
  type ShippingAddressSnapshot,
} from "@/lib/merchandiseShipping";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  confirmMerchandiseRazorpayPayment,
  startMerchandiseRazorpayCheckout,
} from "@/services/payments/merchandiseCheckout";
import { openRazorpayCheckout } from "@/services/payments/razorpayGateway";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { CenterMerchandiseAllocationsCard } from "./CenterMerchandiseAllocationsCard";
import { CenterStudentProfileAddressCard } from "./CenterStudentProfileAddressCard";

type OrderMode = "stock-up" | "per-student";

type CartLine = {
  id: string;
  catalogItemId: string;
  quantity: number;
};

const ORDER_MODE_OPTIONS = [
  { value: "stock-up" as const, label: "Stock up (center bulk)" },
  { value: "per-student" as const, label: "Per student" },
];

const SHIPPING_MODE_OPTIONS = [
  { value: "franchise" as const, label: "Ship to franchise center" },
  { value: "student" as const, label: "Ship to student address" },
  { value: "custom" as const, label: "Custom address" },
];

const emptyCustomAddress = {
  name: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
};

function formatAddressPreview(address: ShippingAddressSnapshot | null): string {
  if (!address) return "Address not available.";
  const parts = [
    address.name,
    address.phone,
    address.address_line1,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return parts.join(" · ") || "Incomplete address.";
}

function paymentBadgeTone(status: string): "default" | "success" | "warning" {
  if (status === "paid") return "success";
  if (status === "unpaid" || status === "pending" || status === "failed") return "warning";
  return "default";
}

function orderInvoice(order: MerchandiseOrderRow) {
  const inv = order.merchandise_invoices;
  if (!inv) return null;
  return Array.isArray(inv) ? inv[0] : inv;
}

function orderTracking(order: MerchandiseOrderRow): Record<string, unknown> | null {
  const t = order.shipping_tracking;
  if (!t || typeof t !== "object") return null;
  return t as Record<string, unknown>;
}

export function CenterMerchandiseOrdersPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const { bindClose, closeAddForm } = useAddFormCloser();

  const [orderMode, setOrderMode] = useState<OrderMode>("stock-up");
  const [orderStudentId, setOrderStudentId] = useState("");
  const [shippingStudentId, setShippingStudentId] = useState("");
  const [shippingMode, setShippingMode] = useState<MerchandiseShippingMode>("franchise");
  const [customAddress, setCustomAddress] = useState(emptyCustomAddress);
  const [catalogItemId, setCatalogItemId] = useState("");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoValid, setPromoValid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<MerchandisePaymentMethod>("invoice");

  const catalog = useQuery({
    queryKey: ["merchandise-catalog-active", brandId],
    enabled: !!brandId,
    queryFn: () => listActiveMerchandiseCatalog(brandId!),
  });

  const brandSettings = useQuery({
    queryKey: ["merchandise-brand-settings", brandId],
    enabled: !!brandId,
    queryFn: () => fetchMerchandiseBrandSettings(brandId!),
  });

  const paymentOptions = useMemo(() => {
    const mode = brandSettings.data?.payment_mode ?? "both";
    if (mode === "razorpay") return [{ value: "razorpay" as const, label: "Pay now (Razorpay)" }];
    if (mode === "invoice") return [{ value: "invoice" as const, label: "Invoice / bank transfer" }];
    return [
      { value: "razorpay" as const, label: "Pay now (Razorpay)" },
      { value: "invoice" as const, label: "Invoice / bank transfer" },
    ];
  }, [brandSettings.data?.payment_mode]);

  useEffect(() => {
    if (paymentOptions.length && !paymentOptions.some((o) => o.value === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]!.value);
    }
  }, [paymentOptions, paymentMethod]);

  const students = useQuery({
    queryKey: ["center-students-for-merchandise-orders", brandId, centerId],
    enabled: !!brandId && !!centerId,
    queryFn: async () => {
      const { data: enrollments, error: eErr } = await getSupabase()
        .from("student_enrollments")
        .select("student_id, students(id, full_name)")
        .eq("center_id", centerId!)
        .eq("status", "active");
      if (eErr) throw eErr;
      const rows = supabaseList(enrollments, null) as {
        student_id: string;
        students: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
      }[];
      return rows.map((r) => {
        const student = Array.isArray(r.students) ? r.students[0] : r.students;
        return { id: student?.id ?? r.student_id, full_name: student?.full_name ?? "Student" };
      });
    },
  });

  const shippingStudentTarget =
    shippingMode === "student"
      ? orderMode === "per-student"
        ? orderStudentId
        : shippingStudentId
      : "";

  const resolvedAddress = useQuery({
    queryKey: ["merchandise-shipping-preview", shippingMode, centerId, brandId, shippingStudentTarget],
    enabled: !!centerId && shippingMode !== "custom" && (shippingMode !== "student" || !!shippingStudentTarget),
    queryFn: async () => {
      if (shippingMode === "franchise") return resolveFranchiseAddress(centerId!);
      if (shippingMode === "student" && brandId && shippingStudentTarget) {
        return resolveStudentAddress(brandId, shippingStudentTarget);
      }
      return null;
    },
  });

  const shippingSnapshot = useMemo((): ShippingAddressSnapshot | null => {
    if (shippingMode === "custom") {
      return snapshotCustomAddress(customAddress);
    }
    return resolvedAddress.data ?? null;
  }, [shippingMode, customAddress, resolvedAddress.data]);

  const cartTotalQty = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotalCents = cart.reduce((sum, line) => {
    const item = catalog.data?.find((c) => c.id === line.catalogItemId);
    return sum + (item ? item.price_cents * line.quantity : 0);
  }, 0);

  const orders = useQuery({
    queryKey: ["center-merchandise-orders", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterMerchandiseOrders(centerId!),
  });

  const paymentAlerts = useQuery({
    queryKey: ["center-merchandise-payment-alerts", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterMerchandisePaymentAlerts(centerId!),
  });

  const validatePromo = useMutation({
    mutationFn: async () => {
      if (!brandId || !promoCode.trim()) throw new Error("Enter a promo code");
      clear();
      const result = await validateMerchandisePromoCode(brandId, promoCode, Math.max(cartTotalQty, 1));
      if (!result.valid) {
        setPromoValid(false);
        setPromoMessage(result.message ?? "Invalid promo code");
        throw new Error(result.message ?? "Invalid promo code");
      }
      setPromoValid(true);
      setPromoMessage(result.message ?? "Promo code applied");
      return result;
    },
    onError: capture,
  });

  const payWithRazorpay = async (orderId: string, amountCents: number) => {
    const { data, error: checkoutErr } = await startMerchandiseRazorpayCheckout(orderId);
    if (checkoutErr) throw new Error(checkoutErr);
    if (data?.status === "stub") {
      throw new Error(String(data.message ?? "Razorpay is not configured."));
    }
    const keyId = String(data?.razorpay_key_id ?? brandSettings.data?.razorpay_key_id ?? "");
    const razorpayOrderId = String(data?.razorpay_order_id ?? "");
    if (!keyId || !razorpayOrderId) throw new Error("Unable to start Razorpay checkout");

    await openRazorpayCheckout({
      keyId,
      orderId,
      razorpayOrderId,
      amountCents,
      currency: "INR",
      name: tenant.brandSlug ?? "Merchandise",
      description: `Order ${orderId.slice(0, 8)}`,
      onSuccess: async (paymentId) => {
        await confirmMerchandiseRazorpayPayment(orderId, paymentId, razorpayOrderId, amountCents);
        void qc.invalidateQueries({ queryKey: ["center-merchandise-orders", centerId] });
        void qc.invalidateQueries({ queryKey: ["center-merchandise-payment-alerts", centerId] });
      },
    });
  };

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!brandId || !centerId || cart.length === 0) throw new Error("Add at least one item to the cart");
      if (orderMode === "per-student" && !orderStudentId) throw new Error("Select a student for per-student orders");
      if (shippingMode === "student" && !shippingStudentTarget) throw new Error("Select a student for shipping");
      if (!isShippingAddressComplete(shippingMode, shippingSnapshot)) {
        throw new Error("Shipping address is incomplete. Update the address or choose a different shipping mode.");
      }
      clear();

      const lines = cart.map((line) => {
        const item = catalog.data?.find((c) => c.id === line.catalogItemId);
        if (!item) throw new Error("Catalog item not found");
        return {
          catalogItemId: item.id,
          quantity: line.quantity,
          unitPriceCents: item.price_cents,
          studentId: orderMode === "per-student" ? orderStudentId : undefined,
        };
      });

      const orderId = await createCenterMerchandiseOrder(brandId, centerId, {
        lines,
        shippingMode,
        shippingAddress: shippingSnapshot as Record<string, unknown>,
        promoCode: promoValid ? promoCode : undefined,
        paymentMethod,
      });

      if (paymentMethod === "razorpay") {
        const { data: orderRow, error: orderErr } = await getSupabase()
          .from("merchandise_orders")
          .select("total_cents")
          .eq("id", orderId)
          .single();
        if (orderErr) throw orderErr;
        await payWithRazorpay(orderId, orderRow.total_cents);
      }
      return orderId;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-merchandise-orders", centerId] });
      void qc.invalidateQueries({ queryKey: ["center-merchandise-payment-alerts", centerId] });
      setCart([]);
      setCatalogItemId("");
      setLineQuantity("1");
      setPromoCode("");
      setPromoMessage(null);
      setPromoValid(false);
      closeAddForm();
    },
    onError: capture,
  });

  const markReceived = useMutation({
    mutationFn: (orderId: string) => markMerchandiseOrderReceived(orderId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-merchandise-orders", centerId] });
    },
    onError: capture,
  });

  const retryPayment = useMutation({
    mutationFn: async (order: MerchandiseOrderRow) => {
      clear();
      await payWithRazorpay(order.id, order.total_cents);
    },
    onError: capture,
  });

  const addToCart = () => {
    if (!catalogItemId) return;
    const qty = Math.max(1, parseInt(lineQuantity, 10) || 1);
    setCart((prev) => {
      const existing = prev.find((l) => l.catalogItemId === catalogItemId);
      if (existing) {
        return prev.map((l) =>
          l.catalogItemId === catalogItemId ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...prev, { id: `${catalogItemId}-${Date.now()}`, catalogItemId, quantity: qty }];
    });
    setCatalogItemId("");
    setLineQuantity("1");
  };

  const removeCartLine = (id: string) => {
    setCart((prev) => prev.filter((l) => l.id !== id));
  };

  if (!centerId || !brandId) return <p className="ed-empty">Center context not found.</p>;

  const alerts = paymentAlerts.data;

  return (
    <>
      <PageTitle>Merchandise orders</PageTitle>
      <MutationError message={error} />

      {alerts && alerts.unpaid_count > 0 ? (
        <Card title="Unpaid merchandise">
          <p className="ed-text-sm">
            {alerts.unpaid_count} order{alerts.unpaid_count === 1 ? "" : "s"} awaiting payment (
            {formatInrFromPaise(alerts.unpaid_total_cents)} total).
            {alerts.overdue_count > 0
              ? ` ${alerts.overdue_count} invoice${alerts.overdue_count === 1 ? " is" : "s are"} overdue.`
              : null}
          </p>
        </Card>
      ) : null}

      <AddFormSection buttonLabel="Place order" panelTitle="New merchandise order">
        {({ close }) => {
          bindClose(close);
          return (
            <>
              <FormGrid>
                <Select
                  label="Order mode"
                  value={orderMode}
                  onChange={(v) => {
                    setOrderMode(v as OrderMode);
                    if (v === "stock-up") setOrderStudentId("");
                  }}
                  options={ORDER_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
                {orderMode === "per-student" ? (
                  <Select
                    label="Student"
                    value={orderStudentId}
                    onChange={setOrderStudentId}
                    placeholder="Select student"
                    options={(students.data ?? []).map((s) => ({ value: s.id, label: s.full_name }))}
                  />
                ) : null}
              </FormGrid>

              <FormGrid>
                <Select
                  label="Add SKU"
                  value={catalogItemId}
                  onChange={setCatalogItemId}
                  placeholder="Select item"
                  options={(catalog.data ?? []).map((c) => ({
                    value: c.id,
                    label: `${c.sku} — ${c.name} (${formatInrFromPaise(c.price_cents, c.currency)})`,
                  }))}
                />
                <Input label="Quantity" value={lineQuantity} onChange={setLineQuantity} type="number" />
              </FormGrid>
              <Button onClick={addToCart} disabled={!catalogItemId}>
                Add to cart
              </Button>

              {cart.length > 0 ? (
                <Card title={`Cart (${cartTotalQty} items)`}>
                  <DataList
                    items={cart}
                    render={(line) => {
                      const item = catalog.data?.find((c) => c.id === line.catalogItemId);
                      return (
                        <ListRow
                          aside={
                            <Button variant="ghost" onClick={() => removeCartLine(line.id)}>
                              Remove
                            </Button>
                          }
                        >
                          <div>
                            <strong>{item?.name ?? "Item"}</strong>
                            <div className="ed-text-sm ed-muted">
                              {item?.sku} × {line.quantity} —{" "}
                              {formatInrFromPaise((item?.price_cents ?? 0) * line.quantity, item?.currency)}
                            </div>
                          </div>
                        </ListRow>
                      );
                    }}
                  />
                  <p className="ed-text-sm">
                    Subtotal: <strong>{formatInrFromPaise(cartSubtotalCents)}</strong>
                  </p>
                </Card>
              ) : (
                <p className="ed-text-sm ed-muted">Cart is empty. Add SKUs before submitting.</p>
              )}

              <FormGrid>
                <Select
                  label="Shipping mode"
                  value={shippingMode}
                  onChange={(v) => setShippingMode(v as MerchandiseShippingMode)}
                  options={SHIPPING_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
                {shippingMode === "student" && orderMode === "stock-up" ? (
                  <Select
                    label="Ship to student"
                    value={shippingStudentId}
                    onChange={setShippingStudentId}
                    placeholder="Select student"
                    options={(students.data ?? []).map((s) => ({ value: s.id, label: s.full_name }))}
                  />
                ) : null}
              </FormGrid>

              {shippingMode === "custom" ? (
                <FormGrid>
                  <Input
                    label="Recipient name"
                    value={customAddress.name}
                    onChange={(v) => setCustomAddress((a) => ({ ...a, name: v }))}
                  />
                  <Input
                    label="Phone"
                    value={customAddress.phone}
                    onChange={(v) => setCustomAddress((a) => ({ ...a, phone: v }))}
                  />
                  <Input
                    label="Address line 1"
                    value={customAddress.addressLine1}
                    onChange={(v) => setCustomAddress((a) => ({ ...a, addressLine1: v }))}
                  />
                  <Input
                    label="City"
                    value={customAddress.city}
                    onChange={(v) => setCustomAddress((a) => ({ ...a, city: v }))}
                  />
                  <Input
                    label="State"
                    value={customAddress.state}
                    onChange={(v) => setCustomAddress((a) => ({ ...a, state: v }))}
                  />
                  <Input
                    label="Pincode"
                    value={customAddress.pincode}
                    onChange={(v) => setCustomAddress((a) => ({ ...a, pincode: v }))}
                  />
                </FormGrid>
              ) : (
                <p className="ed-text-sm ed-muted">
                  Shipping preview: {formatAddressPreview(resolvedAddress.data ?? null)}
                  {!isShippingAddressComplete(shippingMode, resolvedAddress.data ?? null) ? (
                    <span> — address incomplete.</span>
                  ) : null}
                </p>
              )}

              <FormGrid>
                <Input
                  label="Promo code"
                  value={promoCode}
                  onChange={(v) => {
                    setPromoCode(v);
                    setPromoValid(false);
                    setPromoMessage(null);
                  }}
                />
              </FormGrid>
              <Button
                variant="ghost"
                onClick={() => validatePromo.mutate()}
                disabled={!promoCode.trim() || validatePromo.isPending || cart.length === 0}
              >
                Validate promo
              </Button>
              {promoMessage ? (
                <p className={`ed-text-sm ${promoValid ? "" : "ed-muted"}`}>{promoMessage}</p>
              ) : null}

              <Select
                label="Payment method"
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as MerchandisePaymentMethod)}
                options={paymentOptions.map((o) => ({ value: o.value, label: o.label }))}
              />

              <Button
                onClick={() => placeOrder.mutate()}
                disabled={cart.length === 0 || placeOrder.isPending}
              >
                Submit order
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <Card title="Order history">
        <DataList
          items={orders.data ?? []}
          empty="No merchandise orders yet."
          render={(o) => {
            const invoice = orderInvoice(o);
            const tracking = orderTracking(o);
            const canMarkReceived = o.status === "shipped";
            const canPay =
              o.payment_method === "razorpay" &&
              (o.payment_status === "unpaid" || o.payment_status === "pending" || o.status === "awaiting_payment");

            return (
              <ListRow
                aside={
                  <>
                    {canPay ? (
                      <Button
                        variant="ghost"
                        onClick={() => retryPayment.mutate(o)}
                        disabled={retryPayment.isPending}
                      >
                        Pay now
                      </Button>
                    ) : null}
                    {canMarkReceived ? (
                      <Button
                        variant="ghost"
                        onClick={() => markReceived.mutate(o.id)}
                        disabled={markReceived.isPending}
                      >
                        Mark received
                      </Button>
                    ) : null}
                  </>
                }
              >
                <div>
                  <strong>Order {o.id.slice(0, 8)}</strong>
                  <div className="ed-text-sm ed-muted">{new Date(o.created_at).toLocaleString()}</div>
                  <div className="ed-text-sm">
                    <Badge>{o.status}</Badge>{" "}
                    <Badge tone={paymentBadgeTone(o.payment_status)}>{o.payment_status}</Badge>
                    {o.shipping_mode ? <Badge>{o.shipping_mode} shipping</Badge> : null}
                  </div>
                  <ul className="ed-text-sm">
                    {o.merchandise_order_lines?.map((line) => {
                      const catalogItem = Array.isArray(line.merchandise_catalog)
                        ? line.merchandise_catalog[0]
                        : line.merchandise_catalog;
                      return (
                        <li key={line.id}>
                          {catalogItem?.sku ?? catalogItem?.name ?? "Item"} × {line.quantity}
                          {line.student_id ? " (per student)" : " (bulk)"}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="ed-text-sm ed-muted">
                    Total: {formatInrFromPaise(o.total_cents)}
                    {o.discount_cents > 0 ? ` (discount ${formatInrFromPaise(o.discount_cents)})` : null}
                  </p>
                  {tracking?.tracking_number ? (
                    <p className="ed-text-sm ed-muted">
                      Tracking: {String(tracking.tracking_number)}
                      {tracking.carrier ? ` · ${String(tracking.carrier)}` : null}
                    </p>
                  ) : null}
                  {invoice ? (
                    <p className="ed-text-sm ed-muted">
                      Invoice {invoice.invoice_number} — {invoice.status}, due{" "}
                      {new Date(invoice.due_at).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
              </ListRow>
            );
          }}
        />
      </Card>

      <CenterMerchandiseAllocationsCard brandId={brandId} centerId={centerId} />
      <CenterStudentProfileAddressCard brandId={brandId} centerId={centerId} />
    </>
  );
}
