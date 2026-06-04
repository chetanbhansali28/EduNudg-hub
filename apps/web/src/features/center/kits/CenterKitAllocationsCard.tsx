import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, FormGrid, Input, ListRow, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  allocateStudentKit,
  listCenterKitAllocations,
  listFulfillableOrderLines,
} from "@/lib/kitOrdersApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = { brandId: string; centerId: string };

export function CenterKitAllocationsCard({ brandId, centerId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [orderLineId, setOrderLineId] = useState("");
  const { bindClose, closeAddForm } = useAddFormCloser();

  const students = useQuery({
    queryKey: ["center-students-for-kits", brandId, centerId],
    enabled: !!brandId && !!centerId,
    queryFn: async () => {
      const { data: enrollments, error: eErr } = await getSupabase()
        .from("student_enrollments")
        .select("student_id, students(id, full_name)")
        .eq("center_id", centerId)
        .eq("status", "active");
      if (eErr) throw eErr;
      const rows = supabaseList(enrollments, null) as {
        student_id: string;
        students: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
      }[];
      return rows.map((r) => {
        const student = Array.isArray(r.students) ? r.students[0] : r.students;
        return { id: student?.id ?? r.student_id, full_name: student?.full_name ?? "Student" };
      });
    },
  });

  const orderLines = useQuery({
    queryKey: ["fulfillable-kit-lines", centerId],
    enabled: !!centerId,
    queryFn: () => listFulfillableOrderLines(centerId),
  });

  const allocations = useQuery({
    queryKey: ["center-kit-allocations", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterKitAllocations(centerId),
  });

  const allocate = useMutation({
    mutationFn: async () => {
      if (!studentId || !orderLineId) throw new Error("Select student and kit line");
      clear();
      await allocateStudentKit(centerId, studentId, orderLineId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-kit-allocations", centerId] });
      setStudentId("");
      setOrderLineId("");
      closeAddForm();
    },
    onError: capture,
  });

  return (
    <Card title="Allocate kits to students">
      <p className="ed-text-sm ed-muted">Assign fulfilled kit order lines to enrolled students. Kits are hidden from the student portal.</p>
      <MutationError message={error} />
      <AddFormSection buttonLabel="Allocate kit" panelTitle="Allocate kit to student">
        {({ close }) => {
          bindClose(close);
          return (
            <>
              <FormGrid>
                <Select
                  label="Student"
                  value={studentId}
                  onChange={setStudentId}
                  placeholder="Select student"
                  options={(students.data ?? []).map((s) => ({ value: s.id, label: s.full_name }))}
                />
                <Select
                  label="Kit order line"
                  value={orderLineId}
                  onChange={setOrderLineId}
                  placeholder="Select line"
                  options={(orderLines.data ?? []).map((l) => ({
                    value: l.orderLineId,
                    label: `${l.catalogName ?? "Kit"} × ${l.quantity} (${l.orderStatus})`,
                  }))}
                />
              </FormGrid>
              <Button onClick={() => allocate.mutate()} disabled={!studentId || !orderLineId || allocate.isPending}>
                Allocate kit
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <DataList
        items={allocations.data ?? []}
        empty="No kit allocations yet."
        render={(row) => {
          const student = Array.isArray(row.students) ? row.students[0] : row.students;
          const line = Array.isArray(row.kit_order_lines) ? row.kit_order_lines[0] : row.kit_order_lines;
          const catalog = line && (Array.isArray(line.kit_catalog) ? line.kit_catalog[0] : line.kit_catalog);
          return (
            <ListRow>
              <div>
                <strong>{student?.full_name ?? "Student"}</strong>
                <div className="ed-text-sm ed-muted">
                  {catalog?.name ?? "Kit"} · {new Date(row.created_at).toLocaleDateString()}
                </div>
              </div>
            </ListRow>
          );
        }}
      />
    </Card>
  );
}
