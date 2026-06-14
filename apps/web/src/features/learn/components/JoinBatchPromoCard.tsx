import { Link } from "react-router-dom";
import { Button } from "@edunudg/ui";

type Props = {
  batchCount?: number;
  programName?: string | null;
};

export function JoinBatchPromoCard({ batchCount = 0, programName }: Props) {
  const label = programName ?? "your program";

  return (
    <article className="ed-sp-promo-card ed-sp-promo-card--desktop">
      <div className="ed-sp-promo-card__pattern" aria-hidden />
      <div className="ed-sp-promo-card__content">
        <h3 className="ed-sp-promo-card__heading">Join a Batch</h3>
        <p className="ed-sp-promo-card__text">
          {batchCount > 0
            ? `New cohorts for ${label} are open. Collaborate with peers and learn faster.`
            : `New batches for ${label} will appear here when your center opens enrollment.`}
        </p>
        <Link to="/progress" className="ed-sp-promo-card__cta">
          <Button variant="ghost">Explore Batches</Button>
        </Link>
      </div>
    </article>
  );
}
