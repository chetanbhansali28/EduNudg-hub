import type { ReactNode } from "react";
import { Button, Card, Input } from "@edunudg/ui";
import type { HomepageConfig, HomepageFaq, HomepageFeatureSection } from "@/types/homepage";

export type HomepageEditorFormProps = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
  /** When true, testimonial quotes are managed elsewhere (e.g. success stories). */
  testimonialsManagedExternally?: boolean;
  testimonialsExternalHint?: ReactNode;
};

export function HomepageEditorForm({
  config,
  onChange,
  testimonialsManagedExternally = false,
  testimonialsExternalHint,
}: HomepageEditorFormProps) {
  const updateHero = (field: keyof HomepageConfig["hero"], value: string) => {
    onChange({ ...config, hero: { ...config.hero, [field]: value } });
  };

  return (
    <>
      <Card title="Site">
        <Input
          label="Site name (logo)"
          value={config.meta.siteName}
          onChange={(v) => onChange({ ...config, meta: { ...config.meta, siteName: v } })}
        />
      </Card>

      <Card title="Hero">
        <Input label="Line 1 (sans)" value={config.hero.line1} onChange={(v) => updateHero("line1", v)} />
        <Input label="Line 1 (serif)" value={config.hero.line1Serif} onChange={(v) => updateHero("line1Serif", v)} />
        <Input label="Line 2 (sans)" value={config.hero.line2} onChange={(v) => updateHero("line2", v)} />
        <Input label="Line 2 (serif)" value={config.hero.line2Serif} onChange={(v) => updateHero("line2Serif", v)} />
        <Input label="Subtitle" value={config.hero.subtitle} onChange={(v) => updateHero("subtitle", v)} />
        <Input label="CTA label" value={config.hero.ctaLabel} onChange={(v) => updateHero("ctaLabel", v)} />
        <Input label="CTA link" value={config.hero.ctaHref} onChange={(v) => updateHero("ctaHref", v)} />
        <Input
          label="Hero background image URL"
          value={config.hero.backgroundImageUrl}
          onChange={(v) => updateHero("backgroundImageUrl", v)}
        />
        <Input
          label="Phone frame image URL"
          value={config.hero.phoneFrameUrl}
          onChange={(v) => updateHero("phoneFrameUrl", v)}
        />
      </Card>

      <Card title="Feature sections (phone blocks)">
        {config.featureSections.map((section, i) => (
          <div key={section.id} className="ed-form-section">
            <Input
              label={`Section ${i + 1} title`}
              value={section.title}
              onChange={(v) => {
                const featureSections = [...config.featureSections];
                featureSections[i] = { ...section, title: v };
                onChange({ ...config, featureSections });
              }}
            />
            <Input
              label="Serif phrase"
              value={section.titleSerif}
              onChange={(v) => {
                const featureSections = [...config.featureSections];
                featureSections[i] = { ...section, titleSerif: v };
                onChange({ ...config, featureSections });
              }}
            />
            <Input
              label="Body"
              value={section.body}
              onChange={(v) => {
                const featureSections = [...config.featureSections];
                featureSections[i] = { ...section, body: v };
                onChange({ ...config, featureSections });
              }}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            onChange({
              ...config,
              featureSections: [
                ...config.featureSections,
                { id: `section-${Date.now()}`, title: "New", titleSerif: "section.", body: "Description" } satisfies HomepageFeatureSection,
              ],
            })
          }
        >
          Add feature section
        </Button>
      </Card>

      <Card title="Highlight cards (horizontal scroller)">
        {config.showcaseCards.map((card, i) => (
          <div key={card.id} className="ed-form-section">
            <Input
              label="Title"
              value={card.title}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, title: v };
                onChange({ ...config, showcaseCards });
              }}
            />
            <Input
              label="Italic phrase"
              value={card.titleItalic}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, titleItalic: v };
                onChange({ ...config, showcaseCards });
              }}
            />
            <Input
              label="Body"
              value={card.body}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, body: v };
                onChange({ ...config, showcaseCards });
              }}
            />
            <Input
              label="Background image URL"
              value={card.imageUrl ?? ""}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, imageUrl: v || undefined };
                onChange({ ...config, showcaseCards });
              }}
            />
          </div>
        ))}
      </Card>

      <Card title="Testimonials">
        <Input
          label="Section title"
          value={config.testimonials.title}
          onChange={(v) => onChange({ ...config, testimonials: { ...config.testimonials, title: v } })}
        />
        <Input
          label="Section subtitle"
          value={config.testimonials.subtitle}
          onChange={(v) => onChange({ ...config, testimonials: { ...config.testimonials, subtitle: v } })}
        />
        {testimonialsManagedExternally ? (
          testimonialsExternalHint ?? (
            <p className="ed-text-sm ed-muted">Published success stories appear on the live site automatically.</p>
          )
        ) : (
          config.testimonials.items.map((t, i) => (
            <div key={i} className="ed-form-section">
              <Input
                label="Quote"
                value={t.quote}
                onChange={(v) => {
                  const items = [...config.testimonials.items];
                  items[i] = { ...t, quote: v };
                  onChange({ ...config, testimonials: { ...config.testimonials, items } });
                }}
              />
              <Input
                label="Author"
                value={t.author}
                onChange={(v) => {
                  const items = [...config.testimonials.items];
                  items[i] = { ...t, author: v };
                  onChange({ ...config, testimonials: { ...config.testimonials, items } });
                }}
              />
            </div>
          ))
        )}
      </Card>

      <Card title="FAQ">
        {config.faq.map((f, i) => (
          <div key={i} className="ed-form-section">
            <Input
              label="Question"
              value={f.question}
              onChange={(v) => {
                const faq = [...config.faq];
                faq[i] = { ...f, question: v };
                onChange({ ...config, faq });
              }}
            />
            <Input
              label="Answer"
              value={f.answer}
              onChange={(v) => {
                const faq = [...config.faq];
                faq[i] = { ...f, answer: v };
                onChange({ ...config, faq });
              }}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            onChange({
              ...config,
              faq: [...config.faq, { question: "New question?", answer: "Answer here." } satisfies HomepageFaq],
            })
          }
        >
          Add FAQ
        </Button>
      </Card>

      <Card title="Privacy & footer">
        <Input
          label="Privacy title"
          value={config.privacy.title}
          onChange={(v) => onChange({ ...config, privacy: { ...config.privacy, title: v } })}
        />
        <Input
          label="Privacy body"
          value={config.privacy.body}
          onChange={(v) => onChange({ ...config, privacy: { ...config.privacy, body: v } })}
        />
        <Input
          label="Footer CTA title"
          value={config.footerCta.title}
          onChange={(v) => onChange({ ...config, footerCta: { ...config.footerCta, title: v } })}
        />
        <Input
          label="Copyright"
          value={config.footer.copyright}
          onChange={(v) => onChange({ ...config, footer: { ...config.footer, copyright: v } })}
        />
      </Card>
    </>
  );
}
