import { useState } from "react";
import { Button, PageTitle } from "@edunudg/ui";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { BrandCompetitionsSection } from "@/features/brand/kits/BrandCompetitionsSection";
import { BrandMerchandiseCatalogSection } from "./BrandMerchandiseCatalogSection";
import { BrandMerchandiseOrdersSection } from "./BrandMerchandiseOrdersSection";
import { BrandMerchandisePromoSection } from "./BrandMerchandisePromoSection";
import { BrandMerchandisePaymentSettings } from "./BrandMerchandisePaymentSettings";

const TABS = [
  { id: "catalog", label: "Catalog" },
  { id: "promo", label: "Promo codes" },
  { id: "orders", label: "Orders" },
  { id: "payment", label: "Payment settings" },
  { id: "competitions", label: "Competitions" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BrandMerchandisePage() {
  const { brandId, missingBrand } = useBrandScope();
  const [activeTab, setActiveTab] = useState<TabId>("catalog");

  if (missingBrand || !brandId) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return (
    <>
      <PageTitle>Merchandise</PageTitle>

      <div className="ed-page-toolbar" style={{ marginBottom: "1rem" }}>
        <div className="ed-page-toolbar__actions" role="tablist" aria-label="Merchandise sections">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "primary" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {activeTab === "catalog" && <BrandMerchandiseCatalogSection brandId={brandId} />}
      {activeTab === "promo" && <BrandMerchandisePromoSection brandId={brandId} />}
      {activeTab === "orders" && <BrandMerchandiseOrdersSection brandId={brandId} />}
      {activeTab === "payment" && <BrandMerchandisePaymentSettings brandId={brandId} />}
      {activeTab === "competitions" && <BrandCompetitionsSection brandId={brandId} />}
    </>
  );
}
