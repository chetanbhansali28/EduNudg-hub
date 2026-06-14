import { Button } from "@edunudg/ui";
import { HorizontalScrollTrack } from "@/features/learn/components/HorizontalScrollTrack";
import type { OpenBatchRow } from "@/lib/studentBatchJoinApi";

type Props = {
  batches: OpenBatchRow[];
  joinPending: boolean;
  joiningBatchId?: string;
  onJoin: (batchId: string) => void;
};

export function BatchJoinCarousel({ batches, joinPending, joiningBatchId, onJoin }: Props) {
  return (
    <HorizontalScrollTrack ariaLabel="Open batches">
      {batches.map((batch) => (
        <article
          key={batch.batch_id}
          className={`ed-sp-batch-card${batch.already_joined ? " ed-sp-batch-card--joined" : ""}`}
        >
          <p className="ed-sp-batch-card__name">{batch.name}</p>
          <p className="ed-sp-batch-card__meta">
            {batch.program_name} · {batch.level_start} → {batch.level_end}
          </p>
          {batch.already_joined ? (
            <p className="ed-sp-batch-card__badge" role="status">
              Enrolled
            </p>
          ) : (
            <Button
              onClick={() => onJoin(batch.batch_id)}
              disabled={joinPending}
              aria-live="polite"
            >
              {joinPending && joiningBatchId === batch.batch_id ? "Joining…" : "Join now"}
            </Button>
          )}
        </article>
      ))}
    </HorizontalScrollTrack>
  );
}
