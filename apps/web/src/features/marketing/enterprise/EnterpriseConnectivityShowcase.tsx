import type { HomepageConnectivityShowcase } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";
import { EnterpriseIcon } from "./EnterpriseIcon";

type Props = {
  showcase: HomepageConnectivityShowcase;
  fallbackCenterImage?: string;
};

function ConnectivityCard({
  card,
}: {
  card: HomepageConnectivityShowcase["cards"][number];
}) {
  return (
    <article className="ent-connectivity__card">
      <EnterpriseIcon iconKey={card.iconKey} className="ent-icon--tile" />
      <h3>{card.title}</h3>
      <p>{card.body}</p>
    </article>
  );
}

export function EnterpriseConnectivityShowcase({ showcase, fallbackCenterImage }: Props) {
  const centerSrc = showcase.centerImageUrl ?? fallbackCenterImage ?? "";

  return (
    <section id="connectivity" className="ent-section ent-connectivity ent-reveal">
      <div className="ent-section__inner">
        <header className="ent-connectivity__header">
          <h2 className="ent-connectivity__title">{showcase.title}</h2>
          <p className="ent-connectivity__subtitle">{showcase.subtitle}</p>
        </header>

        <div className="ent-connectivity__layout">
          <div className="ent-connectivity__cards">
            {showcase.cards.map((card) => (
              <ConnectivityCard key={card.id} card={card} />
            ))}
          </div>

          {centerSrc ? (
            <div className="ent-connectivity__visual" aria-hidden={showcase.cards.length === 0}>
              <div className="ent-connectivity__phone">
                <MarketingBackgroundMedia src={centerSrc} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
