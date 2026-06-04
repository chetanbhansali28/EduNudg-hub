import { useQuery } from "@tanstack/react-query";
import { Badge, Card, DataList, ListRow, PageTitle } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { listActiveBrandCampaigns } from "@/lib/campaignsApi";

export function CenterCampaignsPage() {
  const tenant = useTenant();
  const brandId = tenant.brandId;

  const campaigns = useQuery({
    queryKey: ["center-active-campaigns", brandId],
    enabled: !!brandId,
    queryFn: () => listActiveBrandCampaigns(brandId!),
  });

  if (!brandId) return <p className="ed-empty">Brand context not found.</p>;

  return (
    <>
      <PageTitle>Brand campaigns</PageTitle>
      <p className="ed-text-sm ed-muted">Active enrollment and marketing campaigns from your brand HQ.</p>
      <Card>
        <DataList
          items={campaigns.data ?? []}
          empty="No active campaigns right now."
          render={(c) => (
            <ListRow>
              <div>
                <strong>{c.name}</strong>
                <Badge>{c.goal_type}</Badge>
                {c.description && <p className="ed-text-sm">{c.description}</p>}
                <div className="ed-text-sm ed-muted">
                  {c.starts_at ? new Date(c.starts_at).toLocaleString() : "Starts anytime"}
                  {c.ends_at ? ` → ${new Date(c.ends_at).toLocaleString()}` : ""}
                </div>
              </div>
            </ListRow>
          )}
        />
      </Card>
    </>
  );
}
