import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { FilterTabs, FormGrid, Input, MobileCartBar, MutationError, Select } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import {
  createCenterMerchandiseOrder,
  listActiveMerchandiseCatalog,
  validateMerchandisePromoCode,
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
import { CenterMerchandiseAllocationsCard } from "./CenterMerchandiseAllocationsCard";
import { CenterMerchandiseOrderHistory } from "./CenterMerchandiseOrderHistory";
import { CenterStudentProfileAddressCard } from "./CenterStudentProfileAddressCard";
import { MerchandiseCheckoutPanel } from "./MerchandiseCheckoutPanel";
import { CenterMerchandiseMobileChrome } from "./CenterMerchandiseMobileChrome";
import { MerchandiseProductGrid } from "./MerchandiseProductGrid";
import { useCommerceBreakpoint } from "./hooks/useCommerceBreakpoint";
import {
  cartSubtotalCents,
  cartTotalQuantity,
  shopLinesFromCart,
  type MerchandiseShopLine,
} from "./merchandiseShopTypes";
import "./merchandiseShop.css";

type ShopTab = "shop" | "orders";

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

export function CenterMerchandiseOrdersPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useCommerceBreakpoint();

  const tab: ShopTab = searchParams.get("tab") === "orders" ? "orders" : "shop";
  const setTab = (next: ShopTab) => {
    if (next === "orders") setSearchParams({ tab: "orders" });
    else setSearchParams({});
  };

  const [cart, setCart] = useState<Record<string, MerchandiseShopLine>>({});
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [checkoutExpanded, setCheckoutExpanded] = useState(false);
  const [shippingStudentId, setShippingStudentId] = useState("");
  const [shippingMode, setShippingMode] = useState<MerchandiseShippingMode>("franchise");
  const [customAddress, setCustomAddress] = useState(emptyCustomAddress);
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

  const cartStudentIds = useMemo(() => {
    const ids = new Set<string>();
    shopLinesFromCart(cart).forEach((line) => {
      if (line.studentId) ids.add(line.studentId);
    });
    return [...ids];
  }, [cart]);

  const shippingStudentTarget = useMemo(() => {
    if (shippingMode !== "student") return "";
    if (cartStudentIds.length === 1) return cartStudentIds[0]!;
    return shippingStudentId;
  }, [shippingMode, cartStudentIds, shippingStudentId]);

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

  const shippingComplete = isShippingAddressComplete(shippingMode, shippingSnapshot);
  const cartQty = cartTotalQuantity(cart);
  const cartSubtotal = cartSubtotalCents(cart, catalog.data ?? []);

  const paymentAlerts = useQuery({
    queryKey: ["center-merchandise-payment-alerts", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterMerchandisePaymentAlerts(centerId!),
  });

  const validatePromo = useMutation({
    mutationFn: async () => {
      if (!brandId || !promoCode.trim()) throw new Error("Enter a promo code");
      clear();
      const result = await validateMerchandisePromoCode(brandId, promoCode, Math.max(cartQty, 1));
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
      const lines = shopLinesFromCart(cart);
      if (!brandId || !centerId || lines.length === 0) throw new Error("Add at least one item to your order");
      if (shippingMode === "student" && !shippingStudentTarget) {
        throw new Error("Select a student for shipping or assign items to one student");
      }
      if (!shippingComplete) {
        throw new Error("Shipping address is incomplete. Update the address or choose a different shipping mode.");
      }
      clear();

      const orderLines = lines.map((line) => {
        const item = catalog.data?.find((c) => c.id === line.catalogItemId);
        if (!item) throw new Error("Catalog item not found");
        return {
          catalogItemId: item.id,
          quantity: line.quantity,
          unitPriceCents: item.price_cents,
          studentId: line.studentId || undefined,
        };
      });

      const orderId = await createCenterMerchandiseOrder(brandId, centerId, {
        lines: orderLines,
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
      setCart({});
      setPromoCode("");
      setPromoMessage(null);
      setPromoValid(false);
      setCheckoutExpanded(false);
      setMobileCartOpen(false);
      setTab("orders");
    },
    onError: capture,
  });

  const updateCartLine = (catalogItemId: string, patch: Partial<MerchandiseShopLine>) => {
    setCart((prev) => {
      const existing = prev[catalogItemId] ?? { catalogItemId, quantity: 0, studentId: "" };
      const next = { ...existing, ...patch };
      if (next.quantity <= 0) {
        const { [catalogItemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [catalogItemId]: next };
    });
    setPromoValid(false);
    setPromoMessage(null);
  };

  const removeCartLine = (catalogItemId: string) => {
    updateCartLine(catalogItemId, { quantity: 0, studentId: "" });
    setCheckoutExpanded(false);
  };

  const handleCheckoutAction = () => {
    if (!checkoutExpanded) {
      setCheckoutExpanded(true);
      return;
    }
    placeOrder.mutate();
  };

  if (!centerId || !brandId) return <p className="ed-empty">Center context not found.</p>;

  const alerts = paymentAlerts.data;
  const catalogItems = catalog.data ?? [];
  const studentOptions = students.data ?? [];
  const needsShippingStudentPick = shippingMode === "student" && cartStudentIds.length !== 1;

  const customAddressFields = (
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
  );

  const shippingStudentFields = needsShippingStudentPick ? (
    <Select
      label="Ship to student"
      value={shippingStudentId}
      onChange={setShippingStudentId}
      placeholder="Select student"
      options={studentOptions.map((s) => ({ value: s.id, label: s.full_name }))}
    />
  ) : null;

  const checkoutPanelProps = {
    cart,
    catalog: catalogItems,
    shippingMode,
    onShippingModeChange: setShippingMode,
    shippingPreview: `Shipping preview: ${formatAddressPreview(resolvedAddress.data ?? null)}`,
    shippingComplete,
    customAddressFields,
    shippingStudentFields,
    promoCode,
    onPromoCodeChange: (v: string) => {
      setPromoCode(v);
      setPromoValid(false);
      setPromoMessage(null);
    },
    promoMessage,
    promoValid,
    onValidatePromo: () => validatePromo.mutate(),
    promoValidating: validatePromo.isPending,
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    paymentOptions,
    onPlaceOrder: handleCheckoutAction,
    onRemoveLine: removeCartLine,
    placing: placeOrder.isPending,
    error,
    checkoutExpanded,
  };

  return (
    <div className="ed-merch-page">
      <header className="ed-merch-page__intro">
        <h1 className="ed-merch-page__title">Merchandise</h1>
        <p className="ed-merch-page__subtitle">Browse and order kits for your center</p>
      </header>
      <MutationError message={error} />

      {alerts && alerts.unpaid_count > 0 ? (
        <div className="ed-card ed-merch-alert">
          <p className="ed-text-sm">
            {alerts.unpaid_count} order{alerts.unpaid_count === 1 ? "" : "s"} awaiting payment (
            {formatInrFromPaise(alerts.unpaid_total_cents)} total).
            {alerts.overdue_count > 0
              ? ` ${alerts.overdue_count} invoice${alerts.overdue_count === 1 ? " is" : "s are"} overdue.`
              : null}
          </p>
        </div>
      ) : null}

      <FilterTabs
        variant="segmented"
        aria-label="Merchandise sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: "shop", label: "Shop" },
          { value: "orders", label: "My Orders" },
        ]}
      />

      {tab === "shop" ? (
        <div className="ed-merch-shop">
          <section aria-label="Product catalog">
            <MerchandiseProductGrid
              catalog={catalogItems}
              cart={cart}
              students={studentOptions}
              onUpdateLine={updateCartLine}
            />
          </section>
          <div className={`ed-merch-checkout${isMobile ? " ed-merch-checkout--mobile-hidden" : ""}`}>
            <MerchandiseCheckoutPanel {...checkoutPanelProps} />
          </div>
        </div>
      ) : (
        <>
          <CenterMerchandiseOrderHistory
            centerId={centerId}
            brandId={brandId}
            brandSlug={tenant.brandSlug}
          />
          <CenterMerchandiseAllocationsCard brandId={brandId} centerId={centerId} />
          <CenterStudentProfileAddressCard brandId={brandId} centerId={centerId} />
        </>
      )}

      {isMobile && tab === "shop" && cartQty > 0 ? (
        <MobileCartBar
          itemCount={cartQty}
          totalLabel={formatInrFromPaise(cartSubtotal)}
          onOpen={() => setMobileCartOpen(true)}
        />
      ) : null}

      {isMobile && mobileCartOpen ? (
        <div className="ed-commerce-drawer" role="dialog" aria-modal aria-label="Your order">
          <button
            type="button"
            className="ed-commerce-drawer__backdrop"
            aria-label="Close cart"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="ed-commerce-drawer__panel">
            <MerchandiseCheckoutPanel {...checkoutPanelProps} />
          </div>
        </div>
      ) : null}

      <CenterMerchandiseMobileChrome />
    </div>
  );
}
