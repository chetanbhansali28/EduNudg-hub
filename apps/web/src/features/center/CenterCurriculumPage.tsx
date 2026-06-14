import { CurriculumWorkspace } from "@/features/brand/curriculum/CurriculumWorkspace";
import { useTenant } from "@/bootstrap/TenantProvider";

export function CenterCurriculumPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;

  if (!brandId) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return <CurriculumWorkspace brandId={brandId} readOnly />;
}
