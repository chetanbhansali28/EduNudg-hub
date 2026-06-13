import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, ToggleField } from "@edunudg/ui";
import { fetchBrandPrograms } from "@/lib/centerProgramApi";
import {
  fetchBrandPublishedCurriculumVersions,
  fetchCenterAuthorizedCurriculumVersionIds,
  latestPublishedVersionByProgram,
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

  const published = useQuery({
    queryKey: ["brand-published-curricula", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandPublishedCurriculumVersions(brandId),
  });

  const authorizedVersionIds = useQuery({
    queryKey: ["center-curriculum-auth", centerId],
    queryFn: () => fetchCenterAuthorizedCurriculumVersionIds(centerId),
  });

  const latestByProgram = useMemo(
    () => latestPublishedVersionByProgram(published.data ?? []),
    [published.data]
  );

  const authorizedProgramIds = useMemo(() => {
    const ids = new Set<string>();
    for (const versionId of authorizedVersionIds.data ?? []) {
      const match = (published.data ?? []).find((v) => v.id === versionId);
      if (match) ids.add(match.program_id);
    }
    return ids;
  }, [authorizedVersionIds.data, published.data]);

  const toggle = useMutation({
    mutationFn: async ({ programId, enabled }: { programId: string; enabled: boolean }) => {
      clear();
      setPendingProgramId(programId);
      await setCenterCourseAuthorized(centerId, brandId, programId, enabled);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-curriculum-auth", centerId] });
      void qc.invalidateQueries({ queryKey: ["center-program-auth", centerId] });
      void qc.invalidateQueries({ queryKey: ["authorized-curricula", centerId] });
      void qc.invalidateQueries({ queryKey: ["course-impact"] });
    },
    onError: capture,
    onSettled: () => setPendingProgramId(null),
  });

  if (programs.isLoading || published.isLoading || authorizedVersionIds.isLoading) {
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
          const publishedVersion = latestByProgram.get(course.id);
          const checked = authorizedProgramIds.has(course.id);
          const canEnable = !!publishedVersion;
          const busy = pendingProgramId === course.id && toggle.isPending;

          return (
            <div key={course.id} className="ed-center-curriculum-toggles__row" role="listitem">
              <ToggleField
                label={course.name}
                description={
                  !canEnable && !checked
                    ? "Publish this course before assigning"
                    : publishedVersion
                      ? `Live version v${publishedVersion.version_number}`
                      : undefined
                }
                checked={checked}
                disabled={busy || (!canEnable && !checked)}
                onChange={(enabled) => toggle.mutate({ programId: course.id, enabled })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
