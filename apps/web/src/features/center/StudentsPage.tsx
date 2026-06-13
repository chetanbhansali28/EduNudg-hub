import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  PageToolbar,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelineMasterDetail,
} from "@edunudg/ui";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { CenterStudentDetailPanel } from "@/features/center/students/CenterStudentDetailPanel";
import { fetchCenterStudents } from "@/lib/centerStudentsApi";
import { markBatchJoinsSeen } from "@/lib/centerBatchesApi";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";
import { initialsFromName } from "@/lib/welcomeMessage";
import "@/features/center/centerOps.css";

export function StudentsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const brandId = tenant.brandId;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const qc = useQueryClient();

  useEffect(() => {
    if (centerId) {
      void markBatchJoinsSeen(centerId)
        .then(() => qc.invalidateQueries({ queryKey: ["shell-context-counts"] }))
        .catch(() => undefined);
    }
  }, [centerId, qc]);

  const students = useQuery({
    queryKey: ["center-students", centerId, brandId],
    enabled: !!centerId && !!brandId,
    queryFn: () => fetchCenterStudents(centerId!, brandId!),
  });

  const transfers = useQuery({
    queryKey: ["transfer-requests", centerId],
    queryFn: async () => {
      let q = getSupabase().from("transfer_requests").select("*").limit(20);
      if (centerId) q = q.eq("from_center_id", centerId);
      const { data, error } = await q;
      return supabaseList(data, error);
    },
  });

  const selected = (students.data ?? []).find((s) => s.id === selectedId) ?? null;

  const batchCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students.data ?? []) {
      map.set(s.id, s.batch_ids.length);
    }
    return map;
  }, [students.data]);

  if (!centerId || !brandId) {
    return <p className="ed-empty">Center context not found.</p>;
  }

  return (
    <>
      <PageToolbar
        title="Students"
        subtitle="Manage enrollments, portal access, batch assignments, and delivery details in one place."
      />

      <AddFormSection buttonLabel="Add students" panelTitle="Add students">
        <>
          <p className="ed-text-sm ed-muted">
            New students should be created by converting a lead after you call the parent — that keeps enrollment data
            aligned with the lead pipeline.
          </p>
          <Link to="/app/leads">
            <Button>Go to leads</Button>
          </Link>
        </>
      </AddFormSection>

      <PipelineMasterDetail
        list={
          <Card title="Enrolled students">
            <DataList
              variant="pipeline"
              items={students.data ?? []}
              empty={
                <PipelineEmptyState
                  message="No active enrollments at this center."
                  actionLabel="View leads"
                  onAction={() => {
                    window.location.href = "/app/leads";
                  }}
                />
              }
              render={(s) => {
                const batchCount = batchCounts.get(s.id) ?? 0;
                return (
                  <PipelineListItem
                    title={s.full_name}
                    meta={s.student_code ?? undefined}
                    lines={[
                      batchCount > 0
                        ? `${batchCount} batch${batchCount === 1 ? "" : "es"}`
                        : "No batches assigned",
                      s.login_email ?? "No portal email",
                    ]}
                    initials={initialsFromName(s.full_name)}
                    selected={s.id === selectedId}
                    onSelect={() => setSelectedId(s.id)}
                    badges={
                      <>
                        {s.user_id && <Badge tone="success">Portal linked</Badge>}
                        {batchCount === 0 && <Badge tone="warning">Unassigned</Badge>}
                      </>
                    }
                  />
                );
              }}
            />
          </Card>
        }
        detail={
          selected ? (
            <CenterStudentDetailPanel
              student={selected}
              brandId={brandId}
              centerId={centerId}
              onSaved={() => void students.refetch()}
            />
          ) : (
            <Card title="Student detail">
              <PipelineDetailPlaceholder message="Select a student to manage portal access, batches, address, and progress." />
            </Card>
          )
        }
      />

      <Card title="Transfer requests">
        <DataList
          items={(transfers.data ?? []).map((t) => ({ ...t, id: t.id as string }))}
          empty="No transfers."
          render={(t) => <span>{t.status as string}</span>}
        />
      </Card>
    </>
  );
}
