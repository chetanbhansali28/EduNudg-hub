import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, Input, PageToolbar } from "@edunudg/ui";
import { fetchHomepageConfig, saveHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig, HomepageFaq, HomepageFeatureSection, HomepageShowcaseCard } from "@/types/homepage";

export function HomepageEditorPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["marketing-homepage"], queryFn: fetchHomepageConfig });
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveHomepageConfig(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-homepage"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <p>Loading homepage config…</p>;

  const updateHero = (field: keyof HomepageConfig["hero"], value: string) => {
    setConfig((c) => ({ ...c, hero: { ...c.hero, [field]: value } }));
  };

  return (
    <>
      <PageToolbar
        title="Marketing homepage"
        subtitle={
          <>
            Novu layout · Inter + Instrument Serif ·{" "}
            <a href="/" target="_blank" rel="noreferrer">
              Preview live
            </a>
          </>
        }
      >
        <Link to="/">
          <Button variant="ghost">Preview</Button>
        </Link>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </Button>
      </PageToolbar>

      <Card title="Site">
        <Input
          label="Site name (logo)"
          value={config.meta.siteName}
          onChange={(v) => setConfig((c) => ({ ...c, meta: { ...c.meta, siteName: v } }))}
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
                setConfig((c) => ({ ...c, featureSections }));
              }}
            />
            <Input
              label="Serif phrase"
              value={section.titleSerif}
              onChange={(v) => {
                const featureSections = [...config.featureSections];
                featureSections[i] = { ...section, titleSerif: v };
                setConfig((c) => ({ ...c, featureSections }));
              }}
            />
            <Input
              label="Body"
              value={section.body}
              onChange={(v) => {
                const featureSections = [...config.featureSections];
                featureSections[i] = { ...section, body: v };
                setConfig((c) => ({ ...c, featureSections }));
              }}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            setConfig((c) => ({
              ...c,
              featureSections: [
                ...c.featureSections,
                { id: `section-${Date.now()}`, title: "New", titleSerif: "section.", body: "Description" } satisfies HomepageFeatureSection,
              ],
            }))
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
                setConfig((c) => ({ ...c, showcaseCards }));
              }}
            />
            <Input
              label="Italic phrase"
              value={card.titleItalic}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, titleItalic: v };
                setConfig((c) => ({ ...c, showcaseCards }));
              }}
            />
            <Input
              label="Body"
              value={card.body}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, body: v };
                setConfig((c) => ({ ...c, showcaseCards }));
              }}
            />
            <Input
              label="Background image URL"
              value={card.imageUrl ?? ""}
              onChange={(v) => {
                const showcaseCards = [...config.showcaseCards];
                showcaseCards[i] = { ...card, imageUrl: v || undefined };
                setConfig((c) => ({ ...c, showcaseCards }));
              }}
            />
          </div>
        ))}
      </Card>

      <Card title="Testimonials">
        <Input
          label="Section title"
          value={config.testimonials.title}
          onChange={(v) => setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, title: v } }))}
        />
        <Input
          label="Section subtitle"
          value={config.testimonials.subtitle}
          onChange={(v) => setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, subtitle: v } }))}
        />
        {config.testimonials.items.map((t, i) => (
          <div key={i} className="ed-form-section">
            <Input
              label="Quote"
              value={t.quote}
              onChange={(v) => {
                const items = [...config.testimonials.items];
                items[i] = { ...t, quote: v };
                setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, items } }));
              }}
            />
            <Input
              label="Author"
              value={t.author}
              onChange={(v) => {
                const items = [...config.testimonials.items];
                items[i] = { ...t, author: v };
                setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, items } }));
              }}
            />
          </div>
        ))}
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
                setConfig((c) => ({ ...c, faq }));
              }}
            />
            <Input
              label="Answer"
              value={f.answer}
              onChange={(v) => {
                const faq = [...config.faq];
                faq[i] = { ...f, answer: v };
                setConfig((c) => ({ ...c, faq }));
              }}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            setConfig((c) => ({
              ...c,
              faq: [...c.faq, { question: "New question?", answer: "Answer here." } satisfies HomepageFaq],
            }))
          }
        >
          Add FAQ
        </Button>
      </Card>

      <Card title="Privacy & footer">
        <Input
          label="Privacy title"
          value={config.privacy.title}
          onChange={(v) => setConfig((c) => ({ ...c, privacy: { ...c.privacy, title: v } }))}
        />
        <Input
          label="Privacy body"
          value={config.privacy.body}
          onChange={(v) => setConfig((c) => ({ ...c, privacy: { ...c.privacy, body: v } }))}
        />
        <Input
          label="Footer CTA title"
          value={config.footerCta.title}
          onChange={(v) => setConfig((c) => ({ ...c, footerCta: { ...c.footerCta, title: v } }))}
        />
        <Input
          label="Copyright"
          value={config.footer.copyright}
          onChange={(v) => setConfig((c) => ({ ...c, footer: { ...c.footer, copyright: v } }))}
        />
      </Card>

      <p style={{ fontSize: "0.8125rem", color: "var(--ed-muted)", marginTop: "1rem" }}>
        Layout matches{" "}
        <a href="https://www.withnovu.com/" target="_blank" rel="noreferrer">
          withnovu.com
        </a>
        . Typography: Inter + Instrument Serif per{" "}
        <a href="https://onepagelove.com/novu" target="_blank" rel="noreferrer">
          One Page Love
        </a>
        .
      </p>
    </>
  );
}
