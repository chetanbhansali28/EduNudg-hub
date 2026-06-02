import { useQuery } from "@tanstack/react-query";
import { Card, DataList, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function FeesPage() {
  const tenant = useTenant();
  const invoices = useQuery({
    queryKey: ["invoices", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("invoices").select("id, amount_cents, status, student_id");
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  const payments = useQuery({
    queryKey: ["payments", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("payments").select("id, amount_cents, paid_at");
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  return (
    <>
      <PageTitle>Fees & Payments</PageTitle>
      <Card title="Invoices">
        <DataList
          items={(invoices.data ?? []).map((i) => (i))}
          render={(i) => (
            <span>
              ₹{(i.amount_cents / 100).toLocaleString()} — {i.status}
            </span>
          )}
        />
      </Card>
      <Card title="Payments">
        <DataList
          items={(payments.data ?? []).map((p) => (p))}
          render={(p) => <span>₹{(p.amount_cents / 100).toLocaleString()}</span>}
        />
      </Card>
    </>
  );
}
