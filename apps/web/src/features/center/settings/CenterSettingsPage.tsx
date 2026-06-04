import { PageTitle, Card } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";

export function CenterSettingsPage() {
  const tenant = useTenant();

  return (
    <>
      <PageTitle>Settings</PageTitle>
      <Card title="Center profile">
        <p className="ed-text-sm ed-muted">
          Center: {tenant.centerSlug ?? "—"} · Brand: {tenant.brandSlug ?? "—"}
        </p>
        <p className="ed-text-sm ed-muted">Contact and fee configuration will be managed here in a future release.</p>
      </Card>
    </>
  );
}
