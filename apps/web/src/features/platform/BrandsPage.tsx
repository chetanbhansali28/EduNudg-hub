import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { brandAdminPath } from "@/lib/adminPaths";
import { portalTargetFromDomain } from "@/lib/brandPortalUrl";
import { PortalOpenButton } from "./PortalOpenButton";
import { Badge, Card, DataList, ListRow, MutationError, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { PlatformSignupRequestsPanel } from "@/features/platform/brandSignups/PlatformSignupRequestsPanel";
import { ManualPlatformBrandSignupCard } from "@/features/platform/brandSignups/ManualPlatformBrandSignupCard";
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";

type BrandStatus = "draft" | "active" | "suspended" | "archived";

interface Brand {
  id: string;
  slug: string;
  name: string;
  status: BrandStatus;
  logo_url: string | null;
}

export function BrandsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, slug, name, status, logo_url")
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as Brand[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["brands"] });
    qc.invalidateQueries({ queryKey: ["platform-stats"] });
  };

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  return (
    <>
      <PageTitle>Brands</PageTitle>
      <MutationError message={error} />

      <ManualPlatformBrandSignupCard />
      <PlatformSignupRequestsPanel />

      <Card title="Brands">
        <DataList
          items={brands.data ?? []}
          empty="No brands yet."
          render={(b) => (
            <ListRow
              aside={
                <>
                  <PortalOpenButton
                    target={portalTargetFromDomain("brand", `${b.slug}.localhost`, b.slug)!}
                    label="Brand backend"
                  />
                  <CrudRowActions
                    editing={false}
                    onEdit={() => navigate(brandAdminPath(b.slug))}
                    onSave={() => {}}
                    onCancel={() => {}}
                    onDelete={() => deleteBrand.mutate(b.id)}
                    deleteDescription="Related data remains but the brand is hidden from lists."
                    deleteTitle="Archive this brand?"
                  />
                </>
              }
            >
              <div>
                <Link to={brandAdminPath(b.slug)} className="ed-brand-name-link">
                  <strong>{b.name}</strong>
                </Link>
                <div className="ed-text-sm ed-muted">{b.slug}</div>
                <Badge tone={b.status === "active" ? "success" : b.status === "suspended" ? "warning" : "default"}>
                  {b.status}
                </Badge>
              </div>
            </ListRow>
          )}
        />
      </Card>
    </>
  );
}
