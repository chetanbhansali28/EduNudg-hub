import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, Input, ListRow, MutationError } from "@edunudg/ui";
import {
  approvePlatformBrandSignup,
  listPendingPlatformSignups,
  rejectPlatformBrandSignup,
} from "@/lib/platformBrandSignupApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

export function PlatformSignupRequestsPanel() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const signups = useQuery({
    queryKey: ["platform-brand-signups"],
    queryFn: listPendingPlatformSignups,
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: err } = await approvePlatformBrandSignup(id);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-brand-signups"] });
      void qc.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: capture,
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (!rejectId) return;
      clear();
      const { error: err } = await rejectPlatformBrandSignup(rejectId, rejectReason);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-brand-signups"] });
      setRejectId(null);
      setRejectReason("");
    },
    onError: capture,
  });

  return (
    <Card title="Signup requests">
      <MutationError message={error} />
      <DataList
        items={signups.data ?? []}
        empty="No pending brand signups."
        render={(row) => (
          <ListRow
            aside={
              <div className="ed-form-section">
                <Button onClick={() => approve.mutate(row.id)} disabled={approve.isPending}>
                  Approve
                </Button>
                <Button variant="ghost" onClick={() => setRejectId(row.id)}>
                  Reject
                </Button>
              </div>
            }
          >
            <div>
              <strong>{row.requested_name}</strong>
              <div className="ed-text-sm ed-muted">
                {row.admin_full_name} · {row.email} · {row.city}
              </div>
              <Badge>{row.status}</Badge>
            </div>
          </ListRow>
        )}
      />
      {rejectId && (
        <div className="ed-form-section" style={{ marginTop: "1rem" }}>
          <Input label="Rejection reason (optional)" value={rejectReason} onChange={setRejectReason} />
          <Button variant="danger" onClick={() => reject.mutate()} disabled={reject.isPending}>
            Confirm reject
          </Button>
          <Button variant="ghost" onClick={() => setRejectId(null)}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}
