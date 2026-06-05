import { useQuery } from "@tanstack/react-query";
import { usePlatformIntegration } from "@/hooks/usePlatformIntegration";
import type { HomepageConfig } from "@/types/homepage";
import { fetchPublicSubscriptionPlans } from "@/lib/subscriptionPlansApi";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { pricingFeatureBullets } from "@/lib/subscriptionPlanFeatures";
import { MarketingCtaLink } from "./MarketingCtaLink";

type Props = {
  ctaHref: HomepageConfig["nav"]["ctaHref"];
  ctaLabel: HomepageConfig["nav"]["ctaLabel"];
};

export function PlatformPricingSection({ ctaHref, ctaLabel }: Props) {
  const pricingEnabled = usePlatformIntegration("public_pricing");
  const plans = useQuery({
    queryKey: ["public-subscription-plans"],
    queryFn: fetchPublicSubscriptionPlans,
  });

  const items = plans.data ?? [];

  if (!pricingEnabled) return null;

  if (plans.isLoading) {
    return (
      <section id="pricing" data-nav-theme="light" className="novu-pricing-section">
        <div className="novu-pricing-section__wrap">
          <p className="novu-pricing-section__status">Loading plans…</p>
        </div>
      </section>
    );
  }

  if (plans.isError) {
    return (
      <section id="pricing" data-nav-theme="light" className="novu-pricing-section">
        <div className="novu-pricing-section__wrap">
          <p className="novu-pricing-section__status">Pricing is temporarily unavailable. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="pricing" data-nav-theme="light" className="novu-pricing-section">
      <div className="novu-pricing-section__wrap">
        <div className="novu-pricing-section__header">
          <h2>
            Simple pricing for <span className="serif">growing brands.</span>
          </h2>
          <p>Transparent monthly plans in Indian Rupees. Scale from your first center to a nationwide franchise network.</p>
        </div>
        <div className="novu-pricing-grid">
          {items.map((plan) => {
            const bullets = pricingFeatureBullets(plan.features);
            const highlight = plan.code === "growth" || plan.is_default;
            return (
              <article
                key={plan.code}
                className={`novu-pricing-card${highlight ? " novu-pricing-card--highlight" : ""}`}
              >
                {plan.code === "growth" && !plan.is_default && (
                  <span className="novu-pricing-card__badge">Most popular</span>
                )}
                <h3 className="novu-pricing-card__name">{plan.name}</h3>
                <p className="novu-pricing-card__price">
                  {formatInrFromPaise(plan.price_cents, plan.currency)}
                  <span className="novu-pricing-card__interval">/{plan.billing_interval}</span>
                </p>
                <ul className="novu-pricing-card__features">
                  {bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <MarketingCtaLink
                  href={ctaHref}
                  label={ctaLabel}
                  variant="on-light"
                  className="novu-pricing-card__cta"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
