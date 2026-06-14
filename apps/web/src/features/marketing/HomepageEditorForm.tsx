import { useState, type DragEvent, type ReactNode } from "react";
import { Button, Input, ToggleField } from "@edunudg/ui";
import type {
  HomepageConfig,
  HomepageFaq,
  HomepageFeatureSection,
  HomepageLink,
  HomepageShowcaseCard,
  HomepageTestimonial,
} from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import { mergeHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import {
  mergeSectionVisibility,
  setSectionEnabled,
  type HomepageSectionKey,
} from "@/lib/homepageSections";
import {
  formatTestimonialQuoteCount,
  moveItem,
  testimonialQuoteLengthHint,
} from "@/lib/testimonialEditorHelpers";
import {
  EditorAccordion,
  EditorFieldSpan,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
  EditorSectionNote,
  EditorStaticSection,
  HomepageEditorSections,
} from "./HomepageEditorShell";
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
  config: rawConfig,
  onChange,
  uploadScope = { kind: "platform" },
  onPersist,
  testimonialsManagedExternally = false,
  testimonialsExternalHint,
}: HomepageEditorFormProps) {
  const config = mergeHomepageConfig(rawConfig ?? DEFAULT_HOMEPAGE_CONFIG);
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
    <>
      <EditorStaticSection sectionId="site" title="Site Identity">
        <EditorFieldsGrid>
          <EditorFieldSpan>
            <Input
              label="Site name"
              value={config.meta.siteName}
              onChange={(v) => onChange({ ...config, meta: { ...config.meta, siteName: v } })}
            />
            <p className="ed-text-sm ed-muted ed-editor-field-hint">
              This name appears in the browser title and header.
            </p>
          </EditorFieldSpan>
          <EditorFieldSpan>
            <MarketingMediaField
              label="Site logo"
              value={config.meta.logoUrl ?? ""}
              onChange={(v) => commitMedia({ ...config, meta: { ...config.meta, logoUrl: v || null } })}
              mediaType="image"
              uploadSubdir=""
              uploadScope={
                uploadScope.kind === "brand" ? uploadScope : { kind: "platform-logo" }
              }
              layout="logo"
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorStaticSection>

      <NavigationEditorSection config={config} updateNavLinks={updateNavLinks} />

      <HomepageEditorSections>
      <EditorAccordion
        sectionId="hero"
        title="Hero"
        enabled={sections.hero}
        onEnabledChange={(enabled) => setSection("hero", enabled)}
      >
        <EditorFieldsGrid>
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
          <EditorFieldSpan>
            <MarketingMediaField
              label="Hero background image or video"
              value={config.hero.backgroundImageUrl}
              onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, backgroundImageUrl: v } })}
              mediaType="image"
              uploadSubdir="hero-background"
              uploadScope={uploadScope}
            />
          </EditorFieldSpan>
          <EditorFieldSpan>
            <MarketingMediaField
              label="Phone frame image"
              value={config.hero.phoneFrameUrl}
              onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, phoneFrameUrl: v } })}
              mediaType="image"
              uploadSubdir="hero-phone-frame"
              uploadScope={uploadScope}
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorAccordion>

      <EditorAccordion
        sectionId="featureScroll"
        title="Feature sections (phone blocks)"
        enabled={sections.featureScroll}
        onEnabledChange={(enabled) => setSection("featureScroll", enabled)}
      >
        <EditorSectionNote>
          Remove blocks you do not need. Keep at least one when this section is enabled — the public site supports any count.
        </EditorSectionNote>
        <EditorItemList
          onAdd={() =>
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
          addLabel="+ Add feature section"
        >
          {config.featureSections.map((section, i) => (
            <EditorItemPanel
              key={section.id}
              title={`Feature block ${i + 1}`}
              onRemove={
                config.featureSections.length <= 1
                  ? undefined
                  : () =>
                      commit({
                        ...config,
                        featureSections: config.featureSections.filter((_, idx) => idx !== i),
                      })
              }
              removeLabel="Remove this block"
            >
              <EditorFieldsGrid>
                <Input
                  label="Title"
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
                <EditorFieldSpan>
                  <Input
                    label="Body"
                    value={section.body}
                    onChange={(v) => {
                      const featureSections = [...config.featureSections];
                      featureSections[i] = { ...section, body: v };
                      onChange({ ...config, featureSections });
                    }}
                  />
                </EditorFieldSpan>
                <EditorFieldSpan>
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
                </EditorFieldSpan>
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="highlights"
        title="Highlight cards (horizontal scroller)"
        enabled={sections.highlights}
        onEnabledChange={(enabled) => setSection("highlights", enabled)}
      >
        <EditorSectionNote>
          Each card appears in the horizontal scroller. Remove cards to show fewer items (e.g. 3 instead of 5).
        </EditorSectionNote>
        <EditorItemList
          onAdd={() =>
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
          addLabel="+ Add highlight card"
        >
          {config.showcaseCards.map((card, i) => (
            <EditorItemPanel
              key={card.id}
              title={`Highlight card ${i + 1}`}
              onRemove={() =>
                commit({
                  ...config,
                  showcaseCards: config.showcaseCards.filter((_, idx) => idx !== i),
                })
              }
              removeLabel="Remove this card"
            >
              <EditorFieldsGrid>
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
                <EditorFieldSpan>
                  <Input
                    label="Body"
                    value={card.body}
                    onChange={(v) => {
                      const showcaseCards = [...config.showcaseCards];
                      showcaseCards[i] = { ...card, body: v };
                      onChange({ ...config, showcaseCards });
                    }}
                  />
                </EditorFieldSpan>
                <EditorFieldSpan>
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
                </EditorFieldSpan>
                <EditorFieldSpan>
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
                </EditorFieldSpan>
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>

      <EditorAccordion
        sectionId="testimonials"
        title="Testimonials"
        enabled={sections.testimonials}
        onEnabledChange={(enabled) => setSection("testimonials", enabled)}
        splitAside={
          <EditorFieldsGrid>
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
            <EditorFieldSpan>
              <div className="ed-testimonial-editor__tip">
                <p className="ed-testimonial-editor__tip-title">
                  <span className="material-symbols-outlined ed-ms-icon" aria-hidden>
                    info
                  </span>
                  Editor tip
                </p>
                <p className="ed-text-sm ed-muted">
                  Keep testimonial quotes between 50–100 characters for optimal readability on mobile devices.
                </p>
              </div>
            </EditorFieldSpan>
          </EditorFieldsGrid>
        }
      >
        {testimonialsManagedExternally ? (
          testimonialsExternalHint ?? (
            <p className="ed-text-sm ed-muted">Published success stories appear on the live site automatically.</p>
          )
        ) : (
          <TestimonialsEditorSection
            items={config.testimonials.items}
            onChange={(items) => onChange({ ...config, testimonials: { ...config.testimonials, items } })}
            onCommit={(items) => commit({ ...config, testimonials: { ...config.testimonials, items } })}
          />
        )}
      </EditorAccordion>

      <EditorAccordion
        sectionId="faq"
        title="FAQ"
        enabled={sections.faq}
        onEnabledChange={(enabled) => setSection("faq", enabled)}
      >
        <EditorItemList
          onAdd={() =>
            commit({
              ...config,
              faq: [...config.faq, { question: "New question?", answer: "Answer here." } satisfies HomepageFaq],
            })
          }
          addLabel="+ Add FAQ"
        >
          {config.faq.map((f, i) => (
            <EditorItemPanel
              key={`${f.question}-${i}`}
              title={`FAQ ${i + 1}`}
              onRemove={() => commit({ ...config, faq: config.faq.filter((_, idx) => idx !== i) })}
              removeLabel="Remove FAQ item"
            >
              <EditorFieldsGrid>
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
              </EditorFieldsGrid>
            </EditorItemPanel>
          ))}
        </EditorItemList>
      </EditorAccordion>
      </HomepageEditorSections>

      <EditorStaticSection sectionId="privacyFooter" title="Privacy & Footer">
        <EditorFieldsGrid>
          <EditorFieldSpan>
            <ToggleField
              label="Show privacy section"
              description="Trust block on homepage."
              checked={sections.privacy}
              onChange={(enabled) => setSection("privacy", enabled)}
            />
          </EditorFieldSpan>
          <EditorFieldSpan>
            <ToggleField
              label="Show site footer"
              description="Logo, links, and copyright."
              checked={sections.footer}
              onChange={(enabled) => setSection("footer", enabled)}
            />
          </EditorFieldSpan>
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
          <EditorFieldSpan>
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
              layout="hero"
              recommendedSize="1920×800px"
            />
          </EditorFieldSpan>
        </EditorFieldsGrid>
      </EditorStaticSection>
    </>
  );
}

function NavigationEditorSection({
  config,
  updateNavLinks,
}: {
  config: HomepageConfig;
  updateNavLinks: (links: HomepageLink[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const onDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    updateNavLinks(moveItem(config.nav.links, dragIndex, index));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <EditorStaticSection
      sectionId="navigation"
      title="Navigation Management"
      headerAction={
        <Button
          variant="primary"
          onClick={() =>
            updateNavLinks([...config.nav.links, { label: "New item", href: "#" } satisfies HomepageLink])
          }
        >
          + Add menu item
        </Button>
      }
    >
      <EditorSectionNote>
        Manage primary links in the top header bar. Use anchors (e.g., <code>#features</code>) for on-page sections.
      </EditorSectionNote>
      <EditorItemList>
        {config.nav.links.map((link, i) => (
          <EditorItemPanel
            key={`nav-link-${i}`}
            title={`Menu item ${i + 1}`}
            variant="nav"
            onRemove={() => updateNavLinks(config.nav.links.filter((_, idx) => idx !== i))}
            removeLabel="Remove menu item"
            className={[
              dragIndex === i ? "ed-editor-nav-row--dragging" : "",
              dragOverIndex === i && dragIndex !== i ? "ed-editor-nav-row--drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            dragHandleProps={{
              draggable: true,
              onDragStart: onDragStart(i),
              onDragOver: onDragOver(i),
              onDrop: onDrop(i),
              onDragEnd,
            }}
          >
            <Input
              label="Label"
              value={link.label}
              onChange={(v) => {
                const links = [...config.nav.links];
                links[i] = { ...link, label: v };
                updateNavLinks(links);
              }}
            />
            <Input
              label="Link"
              value={link.href}
              onChange={(v) => {
                const links = [...config.nav.links];
                links[i] = { ...link, href: v };
                updateNavLinks(links);
              }}
            />
          </EditorItemPanel>
        ))}
      </EditorItemList>
    </EditorStaticSection>
  );
}

function TestimonialsEditorSection({
  items,
  onChange,
  onCommit,
}: {
  items: HomepageTestimonial[];
  onChange: (items: HomepageTestimonial[]) => void;
  onCommit: (items: HomepageTestimonial[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const updateItem = (index: number, patch: Partial<HomepageTestimonial>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onCommit(items.filter((_, i) => i !== index));
  };

  const move = (from: number, to: number) => {
    onCommit(moveItem(items, from, to));
  };

  const onDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const onDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onCommit(moveItem(items, dragIndex, index));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <EditorItemList
      onAdd={() =>
        onCommit([
          ...items,
          {
            quote: "Add a testimonial quote between 50 and 100 characters for best results.",
            author: "Author name",
          },
        ])
      }
      addLabel="+ Add testimonial"
      className="ed-testimonial-editor"
    >
      {items.map((t, i) => {
        const quoteStatus = testimonialQuoteLengthHint(t.quote.trim().length);
        return (
          <EditorItemPanel
            key={`testimonial-${i}-${t.author}`}
            title={`Testimonial ${i + 1}`}
            onRemove={() => removeItem(i)}
            removeLabel="Remove testimonial"
            className={[
              "ed-testimonial-editor__item",
              dragIndex === i ? "ed-testimonial-editor__item--dragging" : "",
              dragOverIndex === i && dragIndex !== i ? "ed-testimonial-editor__item--drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDrop={onDrop(i)}
              onDragEnd={onDragEnd}
            >
              <div className="ed-testimonial-editor__toolbar">
                <span className="ed-testimonial-editor__handle" aria-hidden>
                  ⋮⋮ Drag
                </span>
                <Button variant="ghost" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  Move up
                </Button>
                <Button variant="ghost" onClick={() => move(i, i + 1)} disabled={i === items.length - 1}>
                  Move down
                </Button>
              </div>
              <EditorFieldsGrid>
                <EditorFieldSpan>
                  <Input label="Quote" value={t.quote} onChange={(v) => updateItem(i, { quote: v })} />
                  <p
                    className={[
                      "ed-testimonial-editor__char-hint",
                      quoteStatus !== "ok" ? "ed-testimonial-editor__char-hint--warn" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {formatTestimonialQuoteCount(t.quote.trim().length)}
                    {quoteStatus === "short" ? " — quote is shorter than recommended." : null}
                    {quoteStatus === "long" ? " — quote exceeds recommended length." : null}
                  </p>
                </EditorFieldSpan>
                <Input label="Author" value={t.author} onChange={(v) => updateItem(i, { author: v })} />
              </EditorFieldsGrid>
            </div>
          </EditorItemPanel>
        );
      })}
    </EditorItemList>
  );
}
