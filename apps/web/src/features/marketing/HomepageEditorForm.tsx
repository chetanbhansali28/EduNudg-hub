import type { ReactNode } from "react";
import { Button, Input } from "@edunudg/ui";
import type { HomepageConfig, HomepageFaq, HomepageFeatureSection, HomepageLink } from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import { EditorAccordion } from "./EditorAccordion";
import { MarketingMediaField } from "./MarketingMediaField";

export type HomepageEditorFormProps = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
  /** Where uploaded images/videos are stored in Supabase Storage. */
  uploadScope?: MarketingUploadScope;
  /** When true, testimonial quotes are managed elsewhere (e.g. success stories). */
  testimonialsManagedExternally?: boolean;
  testimonialsExternalHint?: ReactNode;
};

export function HomepageEditorForm({
  config,
  onChange,
  uploadScope = { kind: "platform" },
  testimonialsManagedExternally = false,
  testimonialsExternalHint,
}: HomepageEditorFormProps) {
  const updateHero = (field: keyof HomepageConfig["hero"], value: string) => {
    onChange({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const updatePrimaryCta = (field: "ctaLabel" | "ctaHref", value: string) => {
    onChange({
      ...config,
      nav: { ...config.nav, [field]: value },
      hero: { ...config.hero, [field]: value },
      footerCta: { ...config.footerCta, [field]: value },
    });
  };

  const updateNavLinks = (links: HomepageLink[]) => {
    onChange({ ...config, nav: { ...config.nav, links } });
  };

  return (
    <div className="ed-homepage-editor">
      <EditorAccordion title="Site">
        <Input
          label="Site name"
          value={config.meta.siteName}
          onChange={(v) => onChange({ ...config, meta: { ...config.meta, siteName: v } })}
        />
        <MarketingMediaField
          label="Site logo"
          value={config.meta.logoUrl ?? ""}
          onChange={(v) => onChange({ ...config, meta: { ...config.meta, logoUrl: v || null } })}
          mediaType="image"
          uploadSubdir=""
          uploadScope={{ kind: "platform-logo" }}
        />
      </EditorAccordion>

      <EditorAccordion title="Navigation">
        <p className="ed-text-sm ed-muted">
          Main menu links in the top bar. Use anchors like <code>#faq</code> for on-page sections, or paths like{" "}
          <code>/login</code> for other routes. The primary CTA button is edited under Hero.
        </p>
        {config.nav.links.map((link, i) => (
          <div key={`nav-link-${i}`} className="ed-form-section ed-nav-link-editor">
            <Input
              label={`Menu item ${i + 1} label`}
              value={link.label}
              onChange={(v) => {
                const links = [...config.nav.links];
                links[i] = { ...link, label: v };
                updateNavLinks(links);
              }}
            />
            <Input
              label={`Menu item ${i + 1} link`}
              value={link.href}
              onChange={(v) => {
                const links = [...config.nav.links];
                links[i] = { ...link, href: v };
                updateNavLinks(links);
              }}
            />
            <Button
              variant="ghost"
              onClick={() => updateNavLinks(config.nav.links.filter((_, idx) => idx !== i))}
            >
              Remove menu item
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            updateNavLinks([...config.nav.links, { label: "New item", href: "#" } satisfies HomepageLink])
          }
        >
          Add menu item
        </Button>
      </EditorAccordion>

      <EditorAccordion title="Hero">
        <Input label="Line 1 (sans)" value={config.hero.line1} onChange={(v) => updateHero("line1", v)} />
        <Input label="Line 1 (serif)" value={config.hero.line1Serif} onChange={(v) => updateHero("line1Serif", v)} />
        <Input label="Line 2 (sans)" value={config.hero.line2} onChange={(v) => updateHero("line2", v)} />
        <Input label="Line 2 (serif)" value={config.hero.line2Serif} onChange={(v) => updateHero("line2Serif", v)} />
        <Input label="Subtitle" value={config.hero.subtitle} onChange={(v) => updateHero("subtitle", v)} />
        <Input
          label="Primary CTA label (nav, hero, footer)"
          value={config.nav.ctaLabel}
          onChange={(v) => updatePrimaryCta("ctaLabel", v)}
        />
        <Input
          label="Primary CTA link"
          value={config.nav.ctaHref}
          onChange={(v) => updatePrimaryCta("ctaHref", v)}
        />
        <MarketingMediaField
          label="Hero background image"
          value={config.hero.backgroundImageUrl}
          onChange={(v) => updateHero("backgroundImageUrl", v)}
          mediaType="image"
          uploadSubdir="hero-background"
          uploadScope={uploadScope}
        />
        <MarketingMediaField
          label="Phone frame image"
          value={config.hero.phoneFrameUrl}
          onChange={(v) => updateHero("phoneFrameUrl", v)}
          mediaType="image"
          uploadSubdir="hero-phone-frame"
          uploadScope={uploadScope}
        />
      </EditorAccordion>

      <EditorAccordion title="Feature sections (phone blocks)">
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
            <MarketingMediaField
              label="Phone screen video"
              value={section.videoUrl ?? ""}
              onChange={(v) => {
                const featureSections = [...config.featureSections];
                featureSections[i] = { ...section, videoUrl: v || undefined };
                onChange({ ...config, featureSections });
              }}
              mediaType="video"
              uploadSubdir={`feature-${section.id}`}
              uploadScope={uploadScope}
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
      </EditorAccordion>

      <EditorAccordion title="Highlight cards (horizontal scroller)">
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
            <MarketingMediaField
              label="Background image"
              value={card.imageUrl ?? ""}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, imageUrl: v || undefined };
                onChange({ ...config, showcaseCards });
              }}
              mediaType="image"
              uploadSubdir={`showcase-${card.id}-bg`}
              uploadScope={uploadScope}
            />
            <MarketingMediaField
              label="Phone image (white-phone layout)"
              value={card.phoneImageUrl ?? ""}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, phoneImageUrl: v || undefined };
                onChange({ ...config, showcaseCards });
              }}
              mediaType="image"
              uploadSubdir={`showcase-${card.id}-phone`}
              uploadScope={uploadScope}
            />
          </div>
        ))}
      </EditorAccordion>

      <EditorAccordion title="Testimonials">
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
      </EditorAccordion>

      <EditorAccordion title="FAQ">
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
      </EditorAccordion>

      <EditorAccordion title="Privacy & footer">
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
        <MarketingMediaField
          label="Footer CTA background image"
          value={config.footerCta.backgroundImageUrl ?? ""}
          onChange={(v) =>
            onChange({
              ...config,
              footerCta: { ...config.footerCta, backgroundImageUrl: v || undefined },
            })
          }
          mediaType="image"
          uploadSubdir="footer-background"
          uploadScope={uploadScope}
        />
        <Input
          label="Copyright"
          value={config.footer.copyright}
          onChange={(v) => onChange({ ...config, footer: { ...config.footer, copyright: v } })}
        />
      </EditorAccordion>
    </div>
  );
}
