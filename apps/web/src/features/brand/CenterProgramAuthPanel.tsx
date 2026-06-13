import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, MutationError, SaveButton } from "@edunudg/ui";
import {
  fetchBrandPrograms,
  fetchCenterAuthorizedPrograms,
  syncCenterProgramEnablement,
} from "@/lib/centerProgramApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = {
  centerId: string;
  centerName: string;
  brandId: string;
};

export function CenterProgramAuthPanel({ centerId, centerName, brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

  const programs = useQuery({
    queryKey: ["brand-programs-for-auth", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandPrograms(brandId),
  });

  const authorized = useQuery({
    queryKey: ["center-program-auth", centerId],
    queryFn: () => fetchCenterAuthorizedPrograms(centerId),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSelected(new Set((authorized.data ?? []).map((a) => a.programId)));
    setDirty(false);
  }, [authorized.data]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      await syncCenterProgramEnablement(centerId, [...selected]);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-program-auth", centerId] });
      void qc.invalidateQueries({ queryKey: ["authorized-curricula", centerId] });
      setDirty(false);
    },
    onError: capture,
  });

  const toggle = (programId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) next.delete(programId);
      else next.add(programId);
      return next;
    });
    setDirty(true);
  };

  if (programs.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading programs…</p>;
  }

  const list = programs.data ?? [];
  if (list.length === 0) {
    return <p className="ed-text-sm ed-muted">Publish a program curriculum before authorizing centers.</p>;
  }

  return (
    <div className="ed-ops-animate-in">
      <p className="ed-text-sm ed-muted">
        Programs <strong>{centerName}</strong> may run under its franchise agreement.
      </p>
      <MutationError message={error} />
      <div className="ed-ops-program-grid" role="group" aria-label={`Authorized programs for ${centerName}`}>
        {list.map((p) => {
          const on = selected.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              className="ed-ops-program-toggle"
              aria-pressed={on}
              onClick={() => toggle(p.id)}
            >
              {on ? "✓ " : ""}
              {p.name}
            </button>
          );
        })}
      </div>
      {dirty && (
        <div style={{ marginTop: "0.75rem" }}>
          <SaveButton onClick={() => save.mutate()} disabled={save.isPending} label="Save authorization" />
          <Button variant="ghost" onClick={() => {
            setSelected(new Set((authorized.data ?? []).map((a) => a.programId)));
            setDirty(false);
          }}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
