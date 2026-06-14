import { Badge, Button, FormGrid, IconLock, Input, MutationError, Select } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { activeMerchandisePhotoUrls } from "@/lib/merchandiseProductPhotoStorage";
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
  onRemoveLine: (catalogItemId: string) => void;
  placing: boolean;
  error: string | null;
  checkoutExpanded?: boolean;
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
  onRemoveLine,
  placing,
  error,
  checkoutExpanded = false,
}: Props) {
  const lines = shopLinesFromCart(cart);
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cartSubtotalCents(cart, catalog);

  return (
    <div className="ed-order-panel">
      <div className="ed-order-panel__head">
        <h2 className="ed-order-panel__title">Your Order</h2>
        {totalQty > 0 ? (
          <span className="ed-order-panel__count">
            {totalQty} {totalQty === 1 ? "Item" : "Items"}
          </span>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <p className="ed-merch-empty-cart">Add items from the catalog to start your order.</p>
      ) : (
        <>
          <div className="ed-order-panel__lines">
            {lines.map((line) => {
              const item = catalog.find((c) => c.id === line.catalogItemId);
              const photos = activeMerchandisePhotoUrls(item?.photo_urls);
              const thumb = photos[0];

              return (
                <div key={line.catalogItemId} className="ed-order-line">
                  {thumb ? (
                    <img src={thumb} alt="" className="ed-order-line__thumb" />
                  ) : (
                    <span className="ed-order-line__thumb" aria-hidden />
                  )}
                  <div>
                    <div className="ed-order-line__name">{item?.name ?? "Item"}</div>
                    <div className="ed-order-line__qty">Qty: {line.quantity}</div>
                  </div>
                  <span className="ed-order-line__price">
                    {formatInrFromPaise((item?.price_cents ?? 0) * line.quantity, item?.currency)}
                  </span>
                  <button
                    type="button"
                    className="ed-order-line__remove"
                    aria-label={`Remove ${item?.name ?? "item"}`}
                    onClick={() => onRemoveLine(line.catalogItemId)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="ed-order-panel__summary">
            <div className="ed-order-panel__row">
              <span>Subtotal</span>
              <span>{formatInrFromPaise(subtotal)}</span>
            </div>
            <div className="ed-order-panel__row">
              <span>Shipping</span>
              <span className="ed-order-panel__shipping-note">Calculated at next step</span>
            </div>
            <div className="ed-order-panel__row ed-order-panel__row--total">
              <span>Total</span>
              <span>{formatInrFromPaise(subtotal)}</span>
            </div>
          </div>
        </>
      )}

      {lines.length > 0 && checkoutExpanded ? (
        <div className="ed-order-panel__checkout-fields">
          <MutationError message={error} />

          <Select
            label="Ship to"
            value={shippingMode}
            onChange={(v) => onShippingModeChange(v as MerchandiseShippingMode)}
            options={SHIPPING_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          {shippingStudentFields}
          {shippingMode === "custom" ? (
            customAddressFields
          ) : (
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
        </div>
      ) : null}

      {lines.length > 0 ? (
        <>
          <Button onClick={onPlaceOrder} disabled={placing || (checkoutExpanded && !shippingComplete)} block>
            {placing ? "Placing order…" : checkoutExpanded ? "Place order" : "Proceed to Checkout →"}
          </Button>
          <p className="ed-order-panel__secure">
            <IconLock aria-hidden />
            Secure checkout powered by EduNudge Pay
          </p>
        </>
      ) : null}
    </div>
  );
}
