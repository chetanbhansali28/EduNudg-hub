import { Badge, Button, Card, FormGrid, Input, MutationError, Select } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import type { MerchandisePaymentMethod, MerchandiseShippingMode } from "@/lib/merchandiseOrdersApi";
import type { MerchandiseCatalogItem, MerchandiseShopLine } from "./merchandiseShopTypes";
import { cartSubtotalCents, shopLinesFromCart } from "./merchandiseShopTypes";

type PaymentOption = { value: MerchandisePaymentMethod; label: string };

type Props = {
  cart: Record<string, MerchandiseShopLine>;
  catalog: MerchandiseCatalogItem[];
  shippingMode: MerchandiseShippingMode;
  onShippingModeChange: (mode: MerchandiseShippingMode) => void;
  shippingPreview: string;
  shippingComplete: boolean;
  customAddressFields: React.ReactNode;
  shippingStudentFields: React.ReactNode | null;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  promoMessage: string | null;
  promoValid: boolean;
  onValidatePromo: () => void;
  promoValidating: boolean;
  paymentMethod: MerchandisePaymentMethod;
  onPaymentMethodChange: (method: MerchandisePaymentMethod) => void;
  paymentOptions: PaymentOption[];
  onPlaceOrder: () => void;
  placing: boolean;
  error: string | null;
};

const SHIPPING_OPTIONS = [
  { value: "franchise" as const, label: "Ship to my center" },
  { value: "student" as const, label: "Ship to student" },
  { value: "custom" as const, label: "Custom address" },
];

export function MerchandiseCheckoutPanel({
  cart,
  catalog,
  shippingMode,
  onShippingModeChange,
  shippingPreview,
  shippingComplete,
  customAddressFields,
  shippingStudentFields,
  promoCode,
  onPromoCodeChange,
  promoMessage,
  promoValid,
  onValidatePromo,
  promoValidating,
  paymentMethod,
  onPaymentMethodChange,
  paymentOptions,
  onPlaceOrder,
  placing,
  error,
}: Props) {
  const lines = shopLinesFromCart(cart);
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cartSubtotalCents(cart, catalog);

  return (
    <div className="ed-merch-checkout">
    <Card title="Your order">
      {lines.length === 0 ? (
        <p className="ed-merch-empty-cart">Add items from the catalog to start your order.</p>
      ) : (
        <>
          <div className="ed-merch-checkout__lines">
            {lines.map((line) => {
              const item = catalog.find((c) => c.id === line.catalogItemId);
              const studentLabel = line.studentId ? " · student order" : "";
              return (
                <div key={line.catalogItemId} className="ed-merch-checkout__line">
                  <span>
                    {item?.name ?? "Item"} × {line.quantity}
                    <span className="ed-text-sm ed-muted">{studentLabel}</span>
                  </span>
                  <span>{formatInrFromPaise((item?.price_cents ?? 0) * line.quantity, item?.currency)}</span>
                </div>
              );
            })}
          </div>
          <div className="ed-merch-checkout__total">
            <span>
              Subtotal ({totalQty} {totalQty === 1 ? "item" : "items"})
            </span>
            <span>{formatInrFromPaise(subtotal)}</span>
          </div>
        </>
      )}

      {lines.length > 0 ? (
        <>
          <MutationError message={error} />

          <Select
            label="Ship to"
            value={shippingMode}
            onChange={(v) => onShippingModeChange(v as MerchandiseShippingMode)}
            options={SHIPPING_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          {shippingStudentFields}
          {shippingMode === "custom" ? customAddressFields : (
            <p className="ed-text-sm ed-muted">
              {shippingPreview}
              {!shippingComplete ? <Badge tone="warning"> Address incomplete</Badge> : null}
            </p>
          )}

          <FormGrid>
            <Input
              label="Promo code"
              value={promoCode}
              onChange={onPromoCodeChange}
              placeholder="Optional"
            />
          </FormGrid>
          <Button variant="ghost" onClick={onValidatePromo} disabled={!promoCode.trim() || promoValidating}>
            Apply promo
          </Button>
          {promoMessage ? (
            <p className={`ed-text-sm ${promoValid ? "" : "ed-muted"}`}>{promoMessage}</p>
          ) : null}

          <Select
            label="Payment"
            value={paymentMethod}
            onChange={(v) => onPaymentMethodChange(v as MerchandisePaymentMethod)}
            options={paymentOptions.map((o) => ({ value: o.value, label: o.label }))}
          />

          <Button onClick={onPlaceOrder} disabled={placing || !shippingComplete} block>
            {placing ? "Placing order…" : "Place order"}
          </Button>
        </>
      ) : null}
    </Card>
    </div>
  );
}
