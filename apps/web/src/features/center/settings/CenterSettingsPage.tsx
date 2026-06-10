import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageTitle } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { centerPortalUrl } from "@/lib/brandPortalUrl";
import { fetchCenterPublicProfile } from "@/lib/centerProfileApi";
import { CenterPublicProfileForm } from "./CenterPublicProfileForm";

export function CenterSettingsPage() {
  const tenant = useTenant();
  const { user } = useAuth();
  const publicSiteUrl = useMemo(() => {
    if (!tenant.brandSlug || !tenant.centerSlug) return null;
    return centerPortalUrl(tenant.brandSlug, tenant.centerSlug, tenant.hostname);
  }, [tenant.brandSlug, tenant.centerSlug, tenant.hostname]);

  const profile = useQuery({
    queryKey: ["center-public-profile", tenant.centerId],
    enabled: !!tenant.centerId,
    queryFn: () => fetchCenterPublicProfile(tenant.centerId!),
  });

  const p = profile.data;

  return (
    <>
      <PageTitle>Settings</PageTitle>

      {profile.isLoading ? (
        <Card title="Center profile">
          <p className="ed-text-sm ed-muted">Loading…</p>
        </Card>
      ) : !p || !tenant.brandId || !tenant.centerId ? (
        <Card title="Center profile">
          <p className="ed-text-sm ed-muted">Center profile not found.</p>
        </Card>
      ) : (
        <>
          <Card title="Account">
            <p className="ed-text-sm">
              <strong>{p.displayName || p.name}</strong>{" "}
              <Badge tone={p.status === "active" ? "success" : "default"}>{p.status}</Badge>
            </p>
            <p className="ed-text-sm ed-muted">Center URL slug: {p.slug}</p>
            {user?.email ? (
              <p className="ed-text-sm ed-muted">Sign-in email: {user.email}</p>
            ) : null}
            {publicSiteUrl ? (
              <p className="ed-text-sm ed-muted">
                Your public website:{" "}
                <a href={publicSiteUrl} target="_blank" rel="noreferrer">
                  {publicSiteUrl}
                </a>
              </p>
            ) : null}
          </Card>
          <CenterPublicProfileForm brandId={tenant.brandId} centerId={tenant.centerId} profile={p} />
        </>
      )}
    </>
  );
}
