import { CurriculumWorkspace } from "@/features/brand/curriculum/CurriculumWorkspace";
import { useBrandScope } from "./hooks/useBrandScope";

export function CurriculumPage() {
  const { brandId, missingBrand } = useBrandScope();

  if (missingBrand || !brandId) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return <CurriculumWorkspace brandId={brandId} />;
}
