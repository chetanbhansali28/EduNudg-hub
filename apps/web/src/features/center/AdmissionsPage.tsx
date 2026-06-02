import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, Input, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function AdmissionsPage() {
  const tenant = useTenant();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const leads = useQuery({
    queryKey: ["leads", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("leads").select("id, full_name, phone_e164, status").order("created_at", { ascending: false });
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  const addLead = useMutation({
    mutationFn: async () => {
      if (!tenant.brandId || !tenant.centerId) throw new Error("Center context required");
      const { error } = await getSupabase().from("leads").insert({
        brand_id: tenant.brandId,
        center_id: tenant.centerId,
        full_name: name,
        phone_e164: phone,
        status: "new",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setName("");
      setPhone("");
    },
  });

  return (
    <>
      <PageTitle>Admissions</PageTitle>
      <Card title="New lead">
        <Input label="Full name" value={name} onChange={setName} />
        <Input label="Phone" value={phone} onChange={setPhone} />
        <Button onClick={() => addLead.mutate()} disabled={!name}>
          Add lead
        </Button>
      </Card>
      <Card title="Pipeline">
        <DataList
          items={(leads.data ?? []).map((l) => (l))}
          render={(l) => (
            <span>
              {l.full_name} — {l.status}
            </span>
          )}
        />
      </Card>
    </>
  );
}
