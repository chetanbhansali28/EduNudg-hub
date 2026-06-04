import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

interface CenterProfile {
  name: string;
  display_name: string | null;
  slug: string;
  city: string | null;
  pincode: string | null;
  address_line1: string | null;
  contact_phone: string | null;
  short_description: string | null;
  status: string;
}

export function CenterSettingsPage() {
  const tenant = useTenant();

  const profile = useQuery({
    queryKey: ["center-profile", tenant.centerId],
    enabled: !!tenant.centerId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("franchise_centers")
        .select(
          "name, display_name, slug, city, pincode, address_line1, contact_phone, short_description, status"
        )
        .eq("id", tenant.centerId!)
        .maybeSingle();
      return supabaseMaybe(data, error) as CenterProfile | null;
    },
  });

  const p = profile.data;

  return (
    <>
      <PageTitle>Settings</PageTitle>
      <Card title="Center profile">
        <p className="ed-text-sm ed-muted">
          Public blurb and contact on your center site are managed by the brand. Contact your brand admin to update
          display name, address, or phone.
        </p>
        {profile.isLoading ? (
          <p className="ed-text-sm ed-muted">Loading…</p>
        ) : p ? (
          <>
            <p className="ed-text-sm">
              <strong>{p.display_name ?? p.name}</strong>{" "}
              <Badge tone={p.status === "active" ? "success" : "default"}>{p.status}</Badge>
            </p>
            <p className="ed-text-sm ed-muted">Slug: {p.slug}</p>
            {p.short_description && <p className="ed-text-sm">{p.short_description}</p>}
            {p.city && (
              <p className="ed-text-sm ed-muted">
                {p.city} {p.pincode}
              </p>
            )}
            {p.address_line1 && <p className="ed-text-sm ed-muted">{p.address_line1}</p>}
            {p.contact_phone && <p className="ed-text-sm ed-muted">Contact: {p.contact_phone}</p>}
          </>
        ) : (
          <p className="ed-text-sm ed-muted">Center profile not found.</p>
        )}
      </Card>
    </>
  );
}
