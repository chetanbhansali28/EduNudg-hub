import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, DataList, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function StudentsPage() {
  const tenant = useTenant();

  const students = useQuery({
    queryKey: ["students", tenant.brandId],
    queryFn: async () => {
      let q = getSupabase().from("students").select("id, full_name, student_code");
      if (tenant.brandId) q = q.eq("brand_id", tenant.brandId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  const enrollments = useQuery({
    queryKey: ["enrollments", tenant.centerId],
    queryFn: async () => {
      let q = getSupabase().from("student_enrollments").select("id, student_id, status");
      if (tenant.centerId) q = q.eq("center_id", tenant.centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  const transfers = useQuery({
    queryKey: ["transfer-requests"],
    queryFn: async () => {
      const { data, error } = await getSupabase().from("transfer_requests").select("*").limit(20);
      return supabaseList(data, error);
    },
  });

  return (
    <>
      <PageTitle>Students & Transfers</PageTitle>

      <Card title="Add students">
        <p className="ed-text-sm ed-muted">
          New students should be created by converting a lead after you call the parent — that keeps enrollment data
          aligned with the lead pipeline.
        </p>
        <Link to="/app/leads">
          <Button>Go to leads</Button>
        </Link>
      </Card>

      <Card title="Students (brand-owned)">
        <DataList items={(students.data ?? []).map((s) => s)} render={(s) => <strong>{s.full_name}</strong>} />
      </Card>
      <Card title="Active enrollments (this center)">
        <DataList items={(enrollments.data ?? []).map((e) => e)} render={(e) => <span>Enrollment — {e.status}</span>} />
      </Card>
      <Card title="Transfer requests">
        <DataList
          items={(transfers.data ?? []).map((t) => t)}
          empty="No transfers."
          render={(t) => <span>{t.status}</span>}
        />
      </Card>
    </>
  );
}
