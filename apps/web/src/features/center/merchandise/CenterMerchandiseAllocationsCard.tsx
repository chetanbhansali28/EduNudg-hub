import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, CommerceWidgetCard, FormGrid, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  allocateStudentMerchandise,
  listCenterMerchandiseAllocations,
  listFulfillableMerchandiseOrderLines,
} from "@/lib/merchandiseOrdersApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string; centerId: string; layout?: "widget" | "page" };

const ALLOCATE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export function CenterMerchandiseAllocationsCard({
  brandId,
  centerId,
  layout = "page",
}: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [orderLineId, setOrderLineId] = useState("");
  const [formOpen, setFormOpen] = useState(false);

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
      void qc.invalidateQueries({ queryKey: ["center-inventory-summary"] });
      setStudentId("");
      setOrderLineId("");
      setFormOpen(false);
    },
    onError: capture,
  });

  const recentAllocations = (allocations.data ?? []).slice(0, 3);

  const formBody = formOpen ? (
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
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button onClick={() => allocate.mutate()} disabled={!studentId || !orderLineId || allocate.isPending}>
          Allocate merchandise
        </Button>
        <Button variant="ghost" onClick={() => setFormOpen(false)}>
          Cancel
        </Button>
      </div>
    </>
  ) : (
    <Button block onClick={() => setFormOpen(true)}>
      + Allocate Item
    </Button>
  );

  const recentFooter =
    recentAllocations.length > 0 ? (
      <div className="ed-commerce-widget__footer">
        <p className="ed-commerce-widget__footer-label">Recent Allocations</p>
        {recentAllocations.map((row) => {
          const student = Array.isArray(row.students) ? row.students[0] : row.students;
          const line = Array.isArray(row.merchandise_order_lines)
            ? row.merchandise_order_lines[0]
            : row.merchandise_order_lines;
          const catalog =
            line &&
            (Array.isArray(line.merchandise_catalog) ? line.merchandise_catalog[0] : line.merchandise_catalog);
          return (
            <div key={row.id} className="ed-commerce-widget__recent-item">
              <p className="ed-commerce-widget__recent-name">{student?.full_name ?? "Student"}</p>
              <p className="ed-commerce-widget__recent-meta">
                {new Date(row.created_at).toLocaleDateString()} · {catalog?.name ?? "Item"}
              </p>
            </div>
          );
        })}
      </div>
    ) : null;

  if (layout === "widget") {
    return (
      <CommerceWidgetCard
        icon={ALLOCATE_ICON}
        title="Allocate Stock"
        description="Assign bulk merchandise order lines to enrolled students after delivery."
        footer={recentFooter}
      >
        <MutationError message={error} />
        {formBody}
      </CommerceWidgetCard>
    );
  }

  return (
    <CommerceWidgetCard
      icon={ALLOCATE_ICON}
      title="Allocate stock to students"
      description="Assign bulk merchandise order lines to enrolled students after delivery. Per-student order lines are already linked and do not appear here."
      footer={recentFooter}
    >
      <MutationError message={error} />
      {formOpen ? formBody : <Button onClick={() => setFormOpen(true)}>Allocate item</Button>}
      {(allocations.data ?? []).length > recentAllocations.length ? (
        <p className="ed-text-sm ed-muted">{allocations.data?.length} total allocations</p>
      ) : null}
    </CommerceWidgetCard>
  );
}
