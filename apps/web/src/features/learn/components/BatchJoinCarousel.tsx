import { Button } from "@edunudg/ui";
import { HorizontalScrollTrack } from "@/features/learn/components/HorizontalScrollTrack";
import type { OpenBatchRow } from "@/lib/studentBatchJoinApi";

type Props = {
  batches: OpenBatchRow[];
  joinPending: boolean;
  joiningBatchId?: string;
  onJoin: (batchId: string) => void;
};

function BatchIcon() {
  return (
    <span className="ed-sp-batch-card__icon" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </span>
  );
}

export function BatchJoinCarousel({ batches, joinPending, joiningBatchId, onJoin }: Props) {
  return (
    <HorizontalScrollTrack ariaLabel="Open batches">
      {batches.map((batch) => (
        <article
          key={batch.batch_id}
          className={`ed-sp-batch-card${batch.already_joined ? " ed-sp-batch-card--joined" : ""}`}
        >
          <div className="ed-sp-batch-card__top">
            <BatchIcon />
            <div className="ed-sp-batch-card__info">
              <p className="ed-sp-batch-card__name">{batch.name}</p>
              <p className="ed-sp-batch-card__time">
                {batch.program_name} · {batch.level_start} → {batch.level_end}
              </p>
            </div>
          </div>
          {batch.already_joined ? (
            <p className="ed-sp-batch-card__badge" role="status">
              Enrolled
            </p>
          ) : (
            <>
              <p className="ed-sp-batch-card__slots">Open for enrollment · {batch.level_start} program</p>
              <div className="ed-sp-batch-card__cta-wrap">
                <Button
                  onClick={() => onJoin(batch.batch_id)}
                  disabled={joinPending}
                  aria-live="polite"
                  block
                >
                  {joinPending && joiningBatchId === batch.batch_id ? "Joining…" : "Reserve spot"}
                </Button>
              </div>
            </>
          )}
        </article>
      ))}
    </HorizontalScrollTrack>
  );
}
