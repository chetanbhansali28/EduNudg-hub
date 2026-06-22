import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { StudentLeadsView } from "@/features/brand/studentLeads/StudentLeadsView";

export function StudentLeadsPage() {
  const { brandId, missingBrand } = useBrandScope();

  if (missingBrand || !brandId) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return <StudentLeadsView brandId={brandId} />;
}

// Re-export for shared lead list title helper used elsewhere
export { leadListTitle } from "@/features/brand/studentLeads/studentLeadsHelpers";
