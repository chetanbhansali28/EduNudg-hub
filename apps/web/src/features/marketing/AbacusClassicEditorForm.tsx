import type { ReactNode } from "react";
import { Button, Input, ToggleField } from "@edunudg/ui";
import type {
  HomepageConfig,
  HomepageFaq,
  HomepageFeatureSection,
  HomepageFounderProfile,
  HomepageGalleryImage,
  HomepageLink,
  HomepageTrustCard,
} from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import { isAbacusSectionEnabled, setSectionEnabled, type HomepageSectionKey } from "@/lib/homepageSections";
import { EditorAccordion } from "./EditorAccordion";
import { MarketingMediaField } from "./MarketingMediaField";
import { MARKETING_THEME_LABELS, type MarketingTheme } from "@/types/homepage";

export type AbacusClassicEditorFormProps = {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  onChange: (config: HomepageConfig) => void;
  uploadScope?: MarketingUploadScope;
  onPersist?: (config: HomepageConfig) => void | Promise<void>;
  testimonialsExternalHint?: ReactNode;
};

export function AbacusClassicEditorForm({
  config,
  marketingTheme,
  onChange,
  uploadScope = { kind: "platform" },
  onPersist,
  testimonialsExternalHint,
}: AbacusClassicEditorFormProps) {
  const commit = (next: HomepageConfig) => {
    onChange(next);
    void onPersist?.(next);
  };

  const commitMedia = (next: HomepageConfig) => commit(next);

  const setSection = (key: HomepageSectionKey, enabled: boolean) => {
    commit(setSectionEnabled(config, key, enabled));
  };

  const updateNavLinks = (links: HomepageLink[]) => {
    onChange({ ...config, nav: { ...config.nav, links } });
  };

  const rich = config.footer.rich ?? {};

  return (
    <div className="ed-homepage-editor">
      <p className="ed-text-sm ed-muted">
        Theme: <strong>{MARKETING_THEME_LABELS[marketingTheme]}</strong> (managed by EduNudg platform admin)
      </p>

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
          uploadScope={uploadScope}
        />
      </EditorAccordion>

      <EditorAccordion title="Navigation & CTAs">
        <p className="ed-text-sm ed-muted">
          Primary and secondary buttons open enrollment and franchise modals on the public site.
        </p>
        {config.nav.links.map((link, i) => (
          <div key={`nav-${i}`} className="ed-form-section">
            <Input
              label={`Menu ${i + 1} label`}
              value={link.label}
              onChange={(v) => {
                const links = [...config.nav.links];
                links[i] = { ...link, label: v };
                updateNavLinks(links);
              }}
            />
            <Input
              label={`Menu ${i + 1} link`}
              value={link.href}
              onChange={(v) => {
                const links = [...config.nav.links];
                links[i] = { ...link, href: v };
                updateNavLinks(links);
              }}
            />
          </div>
        ))}
        <Button variant="ghost" onClick={() => updateNavLinks([...config.nav.links, { label: "New", href: "#" }])}>
          Add menu item
        </Button>
        <Input label="Primary CTA label (demo)" value={config.nav.ctaLabel} onChange={(v) => commit({ ...config, nav: { ...config.nav, ctaLabel: v }, hero: { ...config.hero, ctaLabel: v } })} />
        <Input label="Secondary CTA label (franchise)" value={config.nav.secondaryCtaLabel ?? ""} onChange={(v) => commit({ ...config, nav: { ...config.nav, secondaryCtaLabel: v }, hero: { ...config.hero, secondaryCtaLabel: v } })} />
      </EditorAccordion>

      <EditorAccordion title="Hero" enabled={isAbacusSectionEnabled(config, "hero")} onEnabledChange={(e) => setSection("hero", e)}>
        <Input label="Badge" value={config.hero.badge ?? ""} onChange={(v) => onChange({ ...config, hero: { ...config.hero, badge: v } })} />
        <Input label="Headline line 1" value={config.hero.line1} onChange={(v) => onChange({ ...config, hero: { ...config.hero, line1: v } })} />
        <Input label="Headline serif part" value={config.hero.line1Serif} onChange={(v) => onChange({ ...config, hero: { ...config.hero, line1Serif: v } })} />
        <Input label="Subtitle" value={config.hero.subtitle} onChange={(v) => onChange({ ...config, hero: { ...config.hero, subtitle: v } })} />
        <MarketingMediaField label="Hero background" value={config.hero.backgroundImageUrl} onChange={(v) => commitMedia({ ...config, hero: { ...config.hero, backgroundImageUrl: v } })} mediaType="image" uploadSubdir="hero-background" uploadScope={uploadScope} />
      </EditorAccordion>

      <EditorAccordion title="Why us (feature blocks)" enabled={isAbacusSectionEnabled(config, "featureGrid")} onEnabledChange={(e) => setSection("featureGrid", e)}>
        {config.featureSections.map((section, i) => (
          <FeatureBlockEditor key={section.id} section={section} index={i} config={config} onChange={onChange} />
        ))}
      </EditorAccordion>

      <EditorAccordion title="Leadership profiles" enabled={isAbacusSectionEnabled(config, "founders")} onEnabledChange={(e) => setSection("founders", e)}>
        {(config.founders ?? []).map((founder, i) => (
          <FounderEditor key={`founder-${i}`} founder={founder} index={i} config={config} onChange={onChange} uploadScope={uploadScope} onPersist={commitMedia} />
        ))}
        <Button variant="ghost" onClick={() => commit({ ...config, founders: [...(config.founders ?? []), emptyFounder()] })}>Add profile</Button>
      </EditorAccordion>

      <EditorAccordion title="Trust & video" enabled={isAbacusSectionEnabled(config, "trustMedia")} onEnabledChange={(e) => setSection("trustMedia", e)}>
        <Input label="Eyebrow" value={config.trustMedia?.eyebrow ?? ""} onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, eyebrow: v } })} />
        <Input label="Title" value={config.trustMedia?.title ?? ""} onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, title: v } })} />
        <Input label="Title highlight (brand name)" value={config.trustMedia?.titleHighlight ?? ""} onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, titleHighlight: v } })} />
        <Input label="Intro" value={config.trustMedia?.intro ?? ""} onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, intro: v } })} />
        <Input label="YouTube URL" value={config.trustMedia?.youtubeUrl ?? ""} onChange={(v) => onChange({ ...config, trustMedia: { ...config.trustMedia!, youtubeUrl: v } })} />
        {(config.trustMedia?.cards ?? []).map((card, i) => (
          <TrustCardEditor key={`trust-${i}`} card={card} index={i} config={config} onChange={onChange} />
        ))}
        <Button variant="ghost" onClick={() => commit({ ...config, trustMedia: { ...config.trustMedia!, cards: [...(config.trustMedia?.cards ?? []), { title: "New highlight", subtitle: "Description" }] } })}>Add stat card</Button>
      </EditorAccordion>

      <EditorAccordion title="Success stories section" enabled={isAbacusSectionEnabled(config, "testimonials")} onEnabledChange={(e) => setSection("testimonials", e)}>
        <Input label="Section title" value={config.testimonials.title} onChange={(v) => onChange({ ...config, testimonials: { ...config.testimonials, title: v } })} />
        <Input label="Section subtitle" value={config.testimonials.subtitle} onChange={(v) => onChange({ ...config, testimonials: { ...config.testimonials, subtitle: v } })} />
        {testimonialsExternalHint}
      </EditorAccordion>

      <EditorAccordion title="FAQ" enabled={isAbacusSectionEnabled(config, "faq")} onEnabledChange={(e) => setSection("faq", e)}>
        {config.faq.map((f, i) => (
          <div key={`faq-${i}`} className="ed-form-section">
            <Input label="Question" value={f.question} onChange={(v) => { const faq = [...config.faq]; faq[i] = { ...f, question: v }; onChange({ ...config, faq }); }} />
            <Input label="Answer" value={f.answer} onChange={(v) => { const faq = [...config.faq]; faq[i] = { ...f, answer: v }; onChange({ ...config, faq }); }} />
          </div>
        ))}
        <Button variant="ghost" onClick={() => commit({ ...config, faq: [...config.faq, { question: "New question?", answer: "Answer." } satisfies HomepageFaq] })}>Add FAQ</Button>
      </EditorAccordion>

      <EditorAccordion title="Photo gallery" enabled={isAbacusSectionEnabled(config, "gallery")} onEnabledChange={(e) => setSection("gallery", e)}>
        <Input label="Gallery title" value={config.gallery?.title ?? ""} onChange={(v) => onChange({ ...config, gallery: { ...config.gallery!, title: v, images: config.gallery?.images ?? [] } })} />
        {(config.gallery?.images ?? []).map((img, i) => (
          <div key={`gallery-${i}`} className="ed-form-section">
            <MarketingMediaField label={`Photo ${i + 1}`} value={img.url} onChange={(v) => { const images = [...(config.gallery?.images ?? [])]; images[i] = { ...img, url: v }; commitMedia({ ...config, gallery: { ...config.gallery!, images } }); }} mediaType="image" uploadSubdir={`gallery-${i}`} uploadScope={uploadScope} />
            <Input label="Alt text" value={img.alt ?? ""} onChange={(v) => { const images = [...(config.gallery?.images ?? [])]; images[i] = { ...img, alt: v }; onChange({ ...config, gallery: { ...config.gallery!, images } }); }} />
            <Button variant="ghost" onClick={() => commit({ ...config, gallery: { ...config.gallery!, images: (config.gallery?.images ?? []).filter((_, idx) => idx !== i) } })}>Remove photo</Button>
          </div>
        ))}
        <Button variant="ghost" onClick={() => commit({ ...config, gallery: { title: config.gallery?.title, images: [...(config.gallery?.images ?? []), { url: "", alt: "" } satisfies HomepageGalleryImage] } })}>Add photo</Button>
      </EditorAccordion>

      <EditorAccordion title="Footer" enabled={isAbacusSectionEnabled(config, "footerRich")} onEnabledChange={(e) => setSection("footerRich", e)}>
        <Input label="Brand description" value={rich.description ?? ""} onChange={(v) => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, description: v } } })} />
        <ToggleField label="Show live franchise & student counts" checked={rich.showLiveStats !== false} onChange={(checked) => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, showLiveStats: checked } } })} />
        {(rich.customStats ?? []).map((stat, i) => (
          <div key={`stat-${i}`} className="ed-form-section">
            <Input label="Stat value" value={stat.value} onChange={(v) => { const customStats = [...(rich.customStats ?? [])]; customStats[i] = { ...stat, value: v }; onChange({ ...config, footer: { ...config.footer, rich: { ...rich, customStats } } }); }} />
            <Input label="Stat label" value={stat.label} onChange={(v) => { const customStats = [...(rich.customStats ?? [])]; customStats[i] = { ...stat, label: v }; onChange({ ...config, footer: { ...config.footer, rich: { ...rich, customStats } } }); }} />
          </div>
        ))}
        <Button variant="ghost" onClick={() => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, customStats: [...(rich.customStats ?? []), { value: "12+", label: "Years" }] } } })}>Add custom stat</Button>
        <Input label="Head office address" value={rich.headOffice?.address ?? ""} onChange={(v) => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, headOffice: { ...rich.headOffice!, address: v, phone: rich.headOffice?.phone ?? "", website: rich.headOffice?.website ?? "" } } } })} />
        <Input label="Head office phone" value={rich.headOffice?.phone ?? ""} onChange={(v) => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, headOffice: { ...rich.headOffice!, phone: v, address: rich.headOffice?.address ?? "", website: rich.headOffice?.website ?? "" } } } })} />
        <Input label="Website" value={rich.headOffice?.website ?? ""} onChange={(v) => onChange({ ...config, footer: { ...config.footer, rich: { ...rich, headOffice: { ...rich.headOffice!, website: v, address: rich.headOffice?.address ?? "", phone: rich.headOffice?.phone ?? "" } } } })} />
        <Input label="Copyright" value={config.footer.copyright} onChange={(v) => onChange({ ...config, footer: { ...config.footer, copyright: v } })} />
      </EditorAccordion>
    </div>
  );
}

function emptyFounder(): HomepageFounderProfile {
  return { roleBadge: "FOUNDER", name: "Name", title: "Title", bio: "Bio", photoUrl: "" };
}

function FeatureBlockEditor({ section, index, config, onChange }: { section: HomepageFeatureSection; index: number; config: HomepageConfig; onChange: (c: HomepageConfig) => void }) {
  return (
    <div className="ed-form-section">
      <Input label={`Block ${index + 1} title`} value={section.title} onChange={(v) => { const featureSections = [...config.featureSections]; featureSections[index] = { ...section, title: v }; onChange({ ...config, featureSections }); }} />
      <Input label="Serif phrase" value={section.titleSerif} onChange={(v) => { const featureSections = [...config.featureSections]; featureSections[index] = { ...section, titleSerif: v }; onChange({ ...config, featureSections }); }} />
      <Input label="Body" value={section.body} onChange={(v) => { const featureSections = [...config.featureSections]; featureSections[index] = { ...section, body: v }; onChange({ ...config, featureSections }); }} />
    </div>
  );
}

function FounderEditor({ founder, index, config, onChange, uploadScope, onPersist }: { founder: HomepageFounderProfile; index: number; config: HomepageConfig; onChange: (c: HomepageConfig) => void; uploadScope: MarketingUploadScope; onPersist: (c: HomepageConfig) => void }) {
  const update = (patch: Partial<HomepageFounderProfile>) => {
    const founders = [...(config.founders ?? [])];
    founders[index] = { ...founder, ...patch };
    onChange({ ...config, founders });
  };
  return (
    <div className="ed-form-section">
      <Input label="Role badge" value={founder.roleBadge} onChange={(v) => update({ roleBadge: v })} />
      <Input label="Name" value={founder.name} onChange={(v) => update({ name: v })} />
      <Input label="Title" value={founder.title} onChange={(v) => update({ title: v })} />
      <Input label="Bio" value={founder.bio} onChange={(v) => update({ bio: v })} />
      <MarketingMediaField label="Photo" value={founder.photoUrl} onChange={(v) => onPersist({ ...config, founders: (config.founders ?? []).map((f, i) => (i === index ? { ...f, photoUrl: v } : f)) })} mediaType="image" uploadSubdir={`founder-${index}`} uploadScope={uploadScope} />
      <Button variant="ghost" onClick={() => onChange({ ...config, founders: (config.founders ?? []).filter((_, i) => i !== index) })}>Remove profile</Button>
    </div>
  );
}

function TrustCardEditor({ card, index, config, onChange }: { card: HomepageTrustCard; index: number; config: HomepageConfig; onChange: (c: HomepageConfig) => void }) {
  return (
    <div className="ed-form-section">
      <Input label={`Card ${index + 1} title`} value={card.title} onChange={(v) => { const cards = [...(config.trustMedia?.cards ?? [])]; cards[index] = { ...card, title: v }; onChange({ ...config, trustMedia: { ...config.trustMedia!, cards } }); }} />
      <Input label="Subtitle" value={card.subtitle} onChange={(v) => { const cards = [...(config.trustMedia?.cards ?? [])]; cards[index] = { ...card, subtitle: v }; onChange({ ...config, trustMedia: { ...config.trustMedia!, cards } }); }} />
    </div>
  );
}
