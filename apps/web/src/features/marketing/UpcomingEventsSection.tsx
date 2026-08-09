import type { HomepageUpcomingEvent, HomepageUpcomingEventsSection } from "@/types/homepage";
import {
  formatEventDateBadge,
  formatEventScheduleLine,
  HOMEPAGE_EVENT_TYPE_LABELS,
} from "@/lib/upcomingEvents";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { AbacusCtaButton } from "./abacus-classic/MarketingLeadModals";
import { useLeadModalOptional } from "./abacus-classic/LeadModalContext";

type Props = {
  section: HomepageUpcomingEventsSection;
  events: HomepageUpcomingEvent[];
  /** When lead modals are available (Abacus/Spark), CTAs can open enroll/apply. */
  useLeadModals?: boolean;
};

function EventCta({
  event,
  useLeadModals,
}: {
  event: HomepageUpcomingEvent;
  useLeadModals?: boolean;
}) {
  const label = event.ctaLabel?.trim() || "Learn more";
  const href = event.ctaHref?.trim() || "#events";
  const leadModal = useLeadModalOptional();

  if (useLeadModals && leadModal) {
    return <AbacusCtaButton label={label} href={href} variant="secondary" />;
  }

  return <MarketingCtaLink href={href} label={label} variant="on-light" className="mkt-events__cta" />;
}

export function UpcomingEventsSection({ section, events, useLeadModals = false }: Props) {
  if (events.length === 0) return null;

  const eyebrow = section.eyebrow?.trim() || "UPCOMING EVENTS";
  const title = section.title?.trim() || "Competitions, workshops & demos";
  const subtitle = section.subtitle?.trim();

  return (
    <section className="mkt-events" id="events" data-testid="upcoming-events">
      <div className="mkt-events__inner">
        <header className="mkt-events__header">
          <p className="mkt-events__eyebrow">{eyebrow}</p>
          <h2 className="mkt-events__title">{title}</h2>
          {subtitle ? <p className="mkt-events__subtitle">{subtitle}</p> : null}
        </header>

        <div className="mkt-events__grid">
          {events.map((event, index) => {
            const badge = formatEventDateBadge(event.startDate);
            const schedule = formatEventScheduleLine(event);
            const typeLabel = HOMEPAGE_EVENT_TYPE_LABELS[event.type] ?? "Event";
            return (
              <article key={`${event.title}-${event.startDate}-${index}`} className="mkt-events__card">
                {event.imageUrl?.trim() ? (
                  <div className="mkt-events__media">
                    <img src={event.imageUrl} alt="" className="mkt-events__image" />
                  </div>
                ) : null}
                <div className="mkt-events__body">
                  <div className="mkt-events__top">
                    <div className="mkt-events__date" aria-label={`${badge.month} ${badge.day}`}>
                      <span className="mkt-events__month">{badge.month}</span>
                      <span className="mkt-events__day">{badge.day}</span>
                    </div>
                    <span className={`mkt-events__type mkt-events__type--${event.type}`}>{typeLabel}</span>
                  </div>
                  <h3 className="mkt-events__card-title">{event.title}</h3>
                  {event.location?.trim() ? (
                    <p className="mkt-events__meta">{event.location.trim()}</p>
                  ) : null}
                  {schedule ? <p className="mkt-events__meta">{schedule}</p> : null}
                  {event.description?.trim() ? (
                    <p className="mkt-events__desc">{event.description.trim()}</p>
                  ) : null}
                  <div className="mkt-events__actions">
                    <EventCta event={event} useLeadModals={useLeadModals} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
