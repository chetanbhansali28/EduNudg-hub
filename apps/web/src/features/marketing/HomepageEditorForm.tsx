import type { ReactNode } from "react";
import { Button, Input, ToggleField } from "@edunudg/ui";
import type {
  HomepageConfig,
  HomepageFaq,
  HomepageFeatureSection,
  HomepageLink,
  HomepageShowcaseCard,
} from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import {
  mergeSectionVisibility,
  setSectionEnabled,
  type HomepageSectionKey,
} from "@/lib/homepageSections";
import { EditorAccordion } from "./EditorAccordion";
import { MarketingMediaField } from "./MarketingMediaField";

export type HomepageEditorFormProps = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
  /** Where uploaded images/videos are stored in Supabase Storage. */
  uploadScope?: MarketingUploadScope;
  /** Persist config after a media upload (e.g. save to database immediately). */
  onPersist?: (config: HomepageConfig) => void | Promise<void>;
  /** When true, testimonial quotes are managed elsewhere (e.g. success stories). */
  testimonialsManagedExternally?: boolean;
  testimonialsExternalHint?: ReactNode;
};

export function HomepageEditorForm({
  config,
  onChange,
  uploadScope = { kind: "platform" },
  onPersist,
  testimonialsManagedExternally = false,
  testimonialsExternalHint,
}: HomepageEditorFormProps) {
  const sections = mergeSectionVisibility(config.sections);

  const commit = (next: HomepageConfig) => {
    onChange(next);
    void onPersist?.(next);
  };

  const commitMedia = (next: HomepageConfig) => {
    commit(next);
  };

  const setSection = (key: HomepageSectionKey, enabled: boolean) => {
    commit(setSectionEnabled(config, key, enabled));
  };

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
          onChange={(v) => commitMedia({ ...config, meta: { ...config.meta, logoUrl: v || null } })}
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

      <EditorAccordion
        title="Hero"
        enabled={sections.hero}
        onEnabledChange={(enabled) => setSection("hero", enabled)}
      >
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
          label="Hero background image or video"
          value={config.hero.backgroundImageUrl}
          onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, backgroundImageUrl: v } })}
          mediaType="image"
          uploadSubdir="hero-background"
          uploadScope={uploadScope}
        />
        <MarketingMediaField
          label="Phone frame image"
          value={config.hero.phoneFrameUrl}
          onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, phoneFrameUrl: v } })}
          mediaType="image"
          uploadSubdir="hero-phone-frame"
          uploadScope={uploadScope}
        />
      </EditorAccordion>

      <EditorAccordion
        title="Feature sections (phone blocks)"
        enabled={sections.featureScroll}
        onEnabledChange={(enabled) => setSection("featureScroll", enabled)}
      >
        <p className="ed-text-sm ed-muted">
          Remove blocks you do not need. Keep at least one when this section is enabled — the public site supports any count.
        </p>
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
                commitMedia({ ...config, featureSections });
              }}
              mediaType="video"
              uploadSubdir={`feature-${section.id}`}
              uploadScope={uploadScope}
            />
            <Button
              variant="ghost"
              disabled={config.featureSections.length <= 1}
              onClick={() =>
                commit({
                  ...config,
                  featureSections: config.featureSections.filter((_, idx) => idx !== i),
                })
              }
            >
              Remove this block
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            commit({
              ...config,
              featureSections: [
                ...config.featureSections,
                {
                  id: `section-${Date.now()}`,
                  title: "New",
                  titleSerif: "section.",
                  body: "Description",
                } satisfies HomepageFeatureSection,
              ],
            })
          }
        >
          Add feature section
        </Button>
      </EditorAccordion>

      <EditorAccordion
        title="Highlight cards (horizontal scroller)"
        enabled={sections.highlights}
        onEnabledChange={(enabled) => setSection("highlights", enabled)}
      >
        <p className="ed-text-sm ed-muted">
          Each card appears in the horizontal scroller. Remove cards to show fewer items (e.g. 3 instead of 5).
        </p>
        {config.showcaseCards.map((card, i) => (
          <div key={card.id} className="ed-form-section">
            <Input
              label={`Card ${i + 1} title`}
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
              label="Background image or video"
              value={card.imageUrl ?? ""}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, imageUrl: v || undefined };
                commitMedia({ ...config, showcaseCards });
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
                commitMedia({ ...config, showcaseCards });
              }}
              mediaType="image"
              uploadSubdir={`showcase-${card.id}-phone`}
              uploadScope={uploadScope}
            />
            <Button
              variant="ghost"
              onClick={() =>
                commit({
                  ...config,
                  showcaseCards: config.showcaseCards.filter((_, idx) => idx !== i),
                })
              }
            >
              Remove this card
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            commit({
              ...config,
              showcaseCards: [
                ...config.showcaseCards,
                {
                  id: `showcase-${Date.now()}`,
                  title: "New",
                  titleItalic: "highlight",
                  body: "Description",
                  layout: "image-dark",
                } satisfies HomepageShowcaseCard,
              ],
            })
          }
        >
          Add highlight card
        </Button>
      </EditorAccordion>

      <EditorAccordion
        title="Testimonials"
        enabled={sections.testimonials}
        onEnabledChange={(enabled) => setSection("testimonials", enabled)}
      >
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
              <Button
                variant="ghost"
                onClick={() =>
                  commit({
                    ...config,
                    testimonials: {
                      ...config.testimonials,
                      items: config.testimonials.items.filter((_, idx) => idx !== i),
                    },
                  })
                }
              >
                Remove testimonial
              </Button>
            </div>
          ))
        )}
        {!testimonialsManagedExternally && (
          <Button
            variant="ghost"
            onClick={() =>
              commit({
                ...config,
                testimonials: {
                  ...config.testimonials,
                  items: [...config.testimonials.items, { quote: "New quote", author: "Author name" }],
                },
              })
            }
          >
            Add testimonial
          </Button>
        )}
      </EditorAccordion>

      <EditorAccordion
        title="FAQ"
        enabled={sections.faq}
        onEnabledChange={(enabled) => setSection("faq", enabled)}
      >
        {config.faq.map((f, i) => (
          <div key={`${f.question}-${i}`} className="ed-form-section">
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
            <Button
              variant="ghost"
              onClick={() => commit({ ...config, faq: config.faq.filter((_, idx) => idx !== i) })}
            >
              Remove FAQ item
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            commit({
              ...config,
              faq: [...config.faq, { question: "New question?", answer: "Answer here." } satisfies HomepageFaq],
            })
          }
        >
          Add FAQ
        </Button>
      </EditorAccordion>

      <EditorAccordion title="Privacy & footer">
        <ToggleField
          label="Show privacy section"
          description="Trust / security copy block on the public homepage."
          checked={sections.privacy}
          onChange={(enabled) => setSection("privacy", enabled)}
        />
        <ToggleField
          label="Show site footer"
          description="Footer CTA banner, link columns, and copyright."
          checked={sections.footer}
          onChange={(enabled) => setSection("footer", enabled)}
        />
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
          label="Footer CTA background image or video"
          value={config.footerCta.backgroundImageUrl ?? ""}
          onChange={(v) =>
            commitMedia({
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
