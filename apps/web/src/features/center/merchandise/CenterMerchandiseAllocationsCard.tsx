import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, FormGrid, ListRow, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  allocateStudentMerchandise,
  listCenterMerchandiseAllocations,
  listFulfillableMerchandiseOrderLines,
} from "@/lib/merchandiseOrdersApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = { brandId: string; centerId: string };

export function CenterMerchandiseAllocationsCard({ brandId, centerId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [orderLineId, setOrderLineId] = useState("");
  const { bindClose, closeAddForm } = useAddFormCloser();

  const students = useQuery({
    queryKey: ["center-students-for-merchandise", brandId, centerId],
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
    queryKey: ["fulfillable-merchandise-lines", centerId],
    enabled: !!centerId,
    queryFn: () => listFulfillableMerchandiseOrderLines(centerId),
  });

  const allocations = useQuery({
    queryKey: ["center-merchandise-allocations", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterMerchandiseAllocations(centerId),
  });

  const allocate = useMutation({
    mutationFn: async () => {
      if (!studentId || !orderLineId) throw new Error("Select student and order line");
      clear();
      await allocateStudentMerchandise(centerId, studentId, orderLineId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-merchandise-allocations", centerId] });
      void qc.invalidateQueries({ queryKey: ["fulfillable-merchandise-lines", centerId] });
      setStudentId("");
      setOrderLineId("");
      closeAddForm();
    },
    onError: capture,
  });

  return (
    <Card title="Allocate stock to students">
      <p className="ed-text-sm ed-muted">
        Assign bulk merchandise order lines to enrolled students after delivery. Per-student order lines are already
        linked and do not appear here.
      </p>
      <MutationError message={error} />
      <AddFormSection buttonLabel="Allocate item" panelTitle="Allocate merchandise to student">
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
                  label="Bulk order line"
                  value={orderLineId}
                  onChange={setOrderLineId}
                  placeholder="Select line"
                  options={(orderLines.data ?? []).map((l) => ({
                    value: l.orderLineId,
                    label: `${l.catalogName ?? "Item"} × ${l.quantity} (${l.orderStatus})`,
                  }))}
                />
              </FormGrid>
              <Button onClick={() => allocate.mutate()} disabled={!studentId || !orderLineId || allocate.isPending}>
                Allocate merchandise
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <DataList
        items={allocations.data ?? []}
        empty="No merchandise allocations yet."
        render={(row) => {
          const student = Array.isArray(row.students) ? row.students[0] : row.students;
          const line = Array.isArray(row.merchandise_order_lines)
            ? row.merchandise_order_lines[0]
            : row.merchandise_order_lines;
          const catalog =
            line && (Array.isArray(line.merchandise_catalog) ? line.merchandise_catalog[0] : line.merchandise_catalog);
          return (
            <ListRow>
              <div>
                <strong>{student?.full_name ?? "Student"}</strong>
                <div className="ed-text-sm ed-muted">
                  {catalog?.name ?? "Item"} · {new Date(row.created_at).toLocaleDateString()}
                </div>
              </div>
            </ListRow>
          );
        }}
      />
    </Card>
  );
}
