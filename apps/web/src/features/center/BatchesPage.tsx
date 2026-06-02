import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, Input, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function BatchesPage() {
  const tenant = useTenant();
  const qc = useQueryClient();
  const [batchName, setBatchName] = useState("");

  const batches = useQuery({
    queryKey: ["batches", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("batches").select("id, name");
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  const addBatch = useMutation({
    mutationFn: async () => {
      if (!tenant.brandId || !tenant.centerId) throw new Error("Center required");
      const { error } = await getSupabase().from("batches").insert({
        brand_id: tenant.brandId,
        center_id: tenant.centerId,
        name: batchName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      setBatchName("");
    },
  });

  return (
    <>
      <PageTitle>Batches & Schedule</PageTitle>
      <Card>
        <Input label="Batch name" value={batchName} onChange={setBatchName} />
        <Button onClick={() => addBatch.mutate()} disabled={!batchName}>
          Create batch
        </Button>
      </Card>
      <Card>
        <DataList
          items={(batches.data ?? []).map((b) => (b))}
          render={(b) => <strong>{b.name}</strong>}
        />
      </Card>
    </>
  );
}
