import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Card, DataList, Input, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";

export function StudentsPage() {
  const tenant = useTenant();
  const qc = useQueryClient();
  const [name, setName] = useState("");

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

  const registerStudent = useMutation({
    mutationFn: async () => {
      if (!tenant.brandId || !tenant.centerId) throw new Error("Center required");
      const { data: student, error: sErr } = await getSupabase()
        .from("students")
        .insert({ brand_id: tenant.brandId, full_name: name })
        .select("id")
        .single();
      if (sErr) throw sErr;
      const { error: eErr } = await getSupabase().from("student_enrollments").insert({
        brand_id: tenant.brandId,
        center_id: tenant.centerId,
        student_id: student.id,
        status: "active",
      });
      if (eErr) throw eErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      setName("");
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
      <Card title="Register & enroll">
        <Input label="Student name" value={name} onChange={setName} />
        <Button onClick={() => registerStudent.mutate()} disabled={!name}>
          Register + enroll
        </Button>
      </Card>
      <Card title="Students (brand-owned)">
        <DataList
          items={(students.data ?? []).map((s) => (s))}
          render={(s) => <strong>{s.full_name}</strong>}
        />
      </Card>
      <Card title="Active enrollments (this center)">
        <DataList
          items={(enrollments.data ?? []).map((e) => (e))}
          render={(e) => <span>Enrollment — {e.status}</span>}
        />
      </Card>
      <Card title="Transfer requests">
        <DataList
          items={(transfers.data ?? []).map((t) => (t))}
          empty="No transfers."
          render={(t) => <span>{t.status}</span>}
        />
      </Card>
    </>
  );
}
