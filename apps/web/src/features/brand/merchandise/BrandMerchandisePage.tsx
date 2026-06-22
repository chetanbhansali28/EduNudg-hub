import { useState } from "react";
import {
  Button,
  CatalogPageHeader,
  CatalogToolbar,
  FilterTabs,
} from "@edunudg/ui";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { BrandCompetitionsSection } from "@/features/brand/kits/BrandCompetitionsSection";
import { useBrandMerchMobile } from "./hooks/useBrandMerchBreakpoint";
import { BrandMerchandiseCatalogSection } from "./BrandMerchandiseCatalogSection";
import { BrandMerchandiseOrdersSection } from "./BrandMerchandiseOrdersSection";
import { BrandMerchandisePromoSection } from "./BrandMerchandisePromoSection";
import { BrandMerchandisePaymentSettings } from "./BrandMerchandisePaymentSettings";
import "./brandMerchandiseCatalog.css";

const TABS = [
  { id: "catalog", label: "Catalog", mobileLabel: "Catalog" },
  { id: "promo", label: "Promo Codes", mobileLabel: "Promo Codes" },
  { id: "orders", label: "Orders", mobileLabel: "Orders" },
  { id: "payment", label: "Payment settings", mobileLabel: "Payment" },
  { id: "competitions", label: "Competitions", mobileLabel: "Competitions" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BrandMerchandisePage() {
  const { brandId, missingBrand } = useBrandScope();
  const [activeTab, setActiveTab] = useState<TabId>("catalog");
  const [catalogAddOpen, setCatalogAddOpen] = useState(false);

  const isMobile = useBrandMerchMobile();

  if (missingBrand || !brandId) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const visibleTabs = isMobile ? TABS.filter((tab) => tab.id !== "competitions") : TABS;
  const tabOptions = visibleTabs.map((tab) => ({
    value: tab.id,
    label: isMobile ? tab.mobileLabel : tab.label,
  }));

  return (
    <div className="ed-brand-merch-page">
      <header className="ed-brand-merch-page__mobile-head">
        <p className="ed-brand-merch-page__eyebrow">Management</p>
        <div className="ed-brand-merch-page__mobile-title-row">
          <h1 className="ed-brand-merch-page__mobile-title">
            {activeTab === "catalog"
              ? "Catalog"
              : (TABS.find((tab) => tab.id === activeTab)?.label ?? "Store")}
          </h1>
          {activeTab === "catalog" ? (
            <button
              type="button"
              className="ed-brand-merch-page__fab"
              aria-label="Add catalog item"
              onClick={() => setCatalogAddOpen(true)}
            >
              +
            </button>
          ) : null}
        </div>
      </header>

      <div className="ed-brand-merch-page__desktop-head">
        <CatalogPageHeader
          title="Merchandise Catalog"
          actions={
            activeTab === "catalog" ? (
              <Button onClick={() => setCatalogAddOpen(true)}>+ Add catalog item</Button>
            ) : null
          }
        />
      </div>

      <CatalogToolbar
        tabs={
          <FilterTabs
            options={tabOptions}
            value={activeTab}
            onChange={(value) => {
              if (value !== "catalog") setCatalogAddOpen(false);
              setActiveTab(value as TabId);
            }}
            variant="segmented"
            aria-label="Merchandise sections"
          />
        }
      />

      {activeTab === "catalog" ? (
        <BrandMerchandiseCatalogSection
          brandId={brandId}
          formOpen={catalogAddOpen}
          onFormOpenChange={setCatalogAddOpen}
        />
      ) : null}
      {activeTab === "promo" ? <BrandMerchandisePromoSection brandId={brandId} /> : null}
      {activeTab === "orders" ? <BrandMerchandiseOrdersSection brandId={brandId} /> : null}
      {activeTab === "payment" ? <BrandMerchandisePaymentSettings brandId={brandId} /> : null}
      {activeTab === "competitions" ? <BrandCompetitionsSection brandId={brandId} /> : null}
    </div>
  );
}
