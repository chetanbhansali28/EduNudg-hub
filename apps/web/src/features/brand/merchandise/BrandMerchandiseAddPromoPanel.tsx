import { useEffect, useRef } from "react";
import { Button, CatalogFormPanel } from "@edunudg/ui";

type Props = {
  open: boolean;
  children: React.ReactNode;
  onSubmit: () => void;
  onClose: () => void;
  submitDisabled: boolean;
  submitPending: boolean;
};

export function BrandMerchandiseAddPromoPanel({
  open,
  children,
  onSubmit,
  onClose,
  submitDisabled,
  submitPending,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  return (
    <div ref={panelRef} className="ed-brand-merch-add-panel" id="brand-merch-add-promo-form">
      <CatalogFormPanel
        title="Add promo code"
        description="Create a discount code franchise centers can apply at checkout."
        footer={
          <>
            <Button onClick={onSubmit} disabled={submitDisabled || submitPending}>
              Add promo code
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </>
        }
      >
        {children}
      </CatalogFormPanel>
    </div>
  );
}
