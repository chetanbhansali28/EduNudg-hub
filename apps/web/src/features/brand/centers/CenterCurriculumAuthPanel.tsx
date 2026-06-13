import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, ToggleField } from "@edunudg/ui";
import {
  fetchBrandPrograms,
  fetchCenterAuthorizedProgramIds,
  setCenterCourseAuthorized,
} from "@/lib/centerCurriculumApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = {
  centerId: string;
  centerName: string;
  brandId: string;
};

export function CenterCurriculumAuthPanel({ centerId, centerName, brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [pendingProgramId, setPendingProgramId] = useState<string | null>(null);

  const programs = useQuery({
    queryKey: ["brand-programs-for-auth", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandPrograms(brandId),
  });

  const authorizedProgramIds = useQuery({
    queryKey: ["center-program-auth", centerId],
    queryFn: () => fetchCenterAuthorizedProgramIds(centerId),
  });

  const authorizedSet = new Set(authorizedProgramIds.data ?? []);

  const toggle = useMutation({
    mutationFn: async ({ programId, enabled }: { programId: string; enabled: boolean }) => {
      clear();
      setPendingProgramId(programId);
      await setCenterCourseAuthorized(centerId, brandId, programId, enabled);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-program-auth", centerId] });
      void qc.invalidateQueries({ queryKey: ["authorized-programs", centerId] });
      void qc.invalidateQueries({ queryKey: ["course-impact"] });
    },
    onError: capture,
    onSettled: () => setPendingProgramId(null),
  });

  if (programs.isLoading || authorizedProgramIds.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading curriculum…</p>;
  }

  const list = programs.data ?? [];
  if (list.length === 0) {
    return (
      <p className="ed-text-sm ed-muted">
        Create a course on the Curriculum page before assigning it to franchises.
      </p>
    );
  }

  return (
    <div className="ed-ops-animate-in ed-center-curriculum-toggles">
      <p className="ed-text-sm ed-muted">
        Turn on each course <strong>{centerName}</strong> may run. Changes save immediately.
      </p>
      <MutationError message={error} />
      <div className="ed-center-curriculum-toggles__list" role="list" aria-label={`Courses for ${centerName}`}>
        {list.map((course) => {
          const checked = authorizedSet.has(course.id);
          const busy = pendingProgramId === course.id && toggle.isPending;

          return (
            <div key={course.id} className="ed-center-curriculum-toggles__row" role="listitem">
              <ToggleField
                label={course.name}
                checked={checked}
                disabled={busy}
                onChange={(enabled) => toggle.mutate({ programId: course.id, enabled })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
