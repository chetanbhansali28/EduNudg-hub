import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList, supabaseMaybe } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useBrandScope } from "./hooks/useBrandScope";

type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "converted";

interface Inquiry {
  id: string;
  full_name: string;
  email: string;
  phone_e164: string | null;
  city: string | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
}

const LEAD_STATUS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "lost", label: "Lost" },
  { value: "converted", label: "Converted" },
];

export function BrandSettingsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

  const [loginHeadline, setLoginHeadline] = useState("");
  const [loginSubtext, setLoginSubtext] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null);
  const [editInquiryStatus, setEditInquiryStatus] = useState<LeadStatus>("new");

  const settings = useQuery({
    queryKey: ["brand-settings", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_settings")
        .select("id, settings")
        .eq("brand_id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; settings: Record<string, unknown> } | null;
    },
  });

  const theme = useQuery({
    queryKey: ["brand-theme", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_themes")
        .select("id, tokens")
        .eq("brand_id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; tokens: Record<string, string> } | null;
    },
  });

  const inquiries = useQuery({
    queryKey: ["franchise-inquiries", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_inquiries")
        .select("id, full_name, email, phone_e164, city, message, status, created_at")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as Inquiry[];
    },
  });

  useEffect(() => {
    const s = settings.data?.settings ?? {};
    setLoginHeadline(String(s.login_headline ?? ""));
    setLoginSubtext(String(s.login_subtext ?? ""));
  }, [settings.data]);

  useEffect(() => {
    setPrimaryColor(theme.data?.tokens?.primary ?? "#2563eb");
  }, [theme.data]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const merged = {
        ...(settings.data?.settings ?? {}),
        login_headline: loginHeadline.trim() || null,
        login_subtext: loginSubtext.trim() || null,
      };
      if (settings.data?.id) {
        const { error: mErr } = await getSupabase()
          .from("brand_settings")
          .update({ settings: merged })
          .eq("id", settings.data.id);
        if (mErr) throw mErr;
      } else {
        const { error: mErr } = await getSupabase()
          .from("brand_settings")
          .insert({ brand_id: brandId, settings: merged });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-settings", brandId] }),
    onError: capture,
  });

  const saveTheme = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const tokens = { ...(theme.data?.tokens ?? {}), primary: primaryColor.trim() };
      if (theme.data?.id) {
        const { error: mErr } = await getSupabase().from("brand_themes").update({ tokens }).eq("id", theme.data.id);
        if (mErr) throw mErr;
      } else {
        const { error: mErr } = await getSupabase().from("brand_themes").insert({ brand_id: brandId, tokens });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-theme", brandId] }),
    onError: capture,
  });

  const updateInquiry = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("franchise_inquiries")
        .update({ status: editInquiryStatus })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      setEditingInquiryId(null);
    },
    onError: capture,
  });

  const deleteInquiry = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Delete this franchise application?")) return;
      clear();
      const { error: mErr } = await getSupabase().from("franchise_inquiries").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] }),
    onError: capture,
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return (
    <>
      <PageTitle>Brand Settings</PageTitle>
      <MutationError message={error} />

      <Card title="White-label & login copy">
        <Input label="Login headline" value={loginHeadline} onChange={setLoginHeadline} />
        <Input label="Login subtext" value={loginSubtext} onChange={setLoginSubtext} />
        <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
          Save settings
        </Button>
      </Card>

      <Card title="Theme">
        <Input label="Primary color" value={primaryColor} onChange={setPrimaryColor} placeholder="#2563eb" />
        <Button onClick={() => saveTheme.mutate()} disabled={saveTheme.isPending}>
          Save theme
        </Button>
      </Card>

      <Card title="Franchise applications">
        <DataList
          items={inquiries.data ?? []}
          empty="No applications yet."
          render={(row) => {
            const editing = editingInquiryId === row.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      setEditingInquiryId(row.id);
                      setEditInquiryStatus(row.status);
                    }}
                    onSave={() => updateInquiry.mutate(row.id)}
                    onCancel={() => setEditingInquiryId(null)}
                    onDelete={() => deleteInquiry.mutate(row.id)}
                    saveDisabled={updateInquiry.isPending}
                  />
                }
              >
                {editing ? (
                  <Select
                    label="Status"
                    value={editInquiryStatus}
                    onChange={setEditInquiryStatus}
                    options={LEAD_STATUS}
                  />
                ) : (
                  <div>
                    <strong>{row.full_name}</strong>
                    <div className="ed-text-sm ed-muted">{row.email}</div>
                    {row.city && <div className="ed-text-sm ed-muted">{row.city}</div>}
                    {row.message && <p className="ed-text-sm">{row.message}</p>}
                    <Badge>{row.status}</Badge>
                  </div>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
