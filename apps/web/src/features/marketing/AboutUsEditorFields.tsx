import { Input, ToggleField } from "@edunudg/ui";
import type { HomepageAboutFeature, HomepageAboutMember, HomepageConfig } from "@/types/homepage";
import type { MarketingUploadScope } from "@/lib/marketingMediaStorage";
import { emptyAboutFeature, emptyAboutMember, emptyAboutSection } from "@/lib/aboutUs";
import {
  EditorFieldSpan,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
  EditorSectionNote,
} from "./HomepageEditorShell";
import { MarketingMediaField } from "./MarketingMediaField";

type Props = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
  commit: (config: HomepageConfig) => void;
  commitMedia: (config: HomepageConfig) => void;
  uploadScope: MarketingUploadScope;
};

export function AboutUsEditorFields({
  config,
  onChange,
  commit,
  commitMedia,
  uploadScope,
}: Props) {
  const section = config.about ?? emptyAboutSection(config.meta.siteName || "Our brand");

  const patch = (next: Partial<typeof section>) => {
    onChange({ ...config, about: { ...section, ...next } });
  };

  const commitPatch = (next: Partial<typeof section>) => {
    commit({ ...config, about: { ...section, ...next } });
  };

  return (
    <>
      <EditorSectionNote>
        Mastermind-style About Us: company story, differentiators, what you do, and a team photo grid
        (photo → name → role). Publish a full <code>/about</code> page and optionally show a teaser on
        the homepage (use the section toggle above).
      </EditorSectionNote>

      <ToggleField
        label="Publish /about page"
        description="When off, visitors to /about are sent to the homepage."
        checked={section.publishPage !== false}
        onChange={(checked) => commitPatch({ publishPage: checked })}
      />

      <EditorFieldsGrid>
        <EditorFieldSpan>
          <Input
            label="Hero headline"
            value={section.heroHeadline ?? ""}
            onChange={(v) => patch({ heroHeadline: v })}
          />
        </EditorFieldSpan>
        <EditorFieldSpan>
          <Input
            label="Hero subtitle"
            value={section.heroSubtitle ?? ""}
            onChange={(v) => patch({ heroSubtitle: v })}
          />
        </EditorFieldSpan>
        <Input
          label="About title"
          value={section.title ?? ""}
          onChange={(v) => patch({ title: v })}
        />
        <EditorFieldSpan>
          <Input
            label="Company story"
            value={section.body ?? ""}
            onChange={(v) => patch({ body: v })}
          />
        </EditorFieldSpan>
        <EditorFieldSpan>
          <MarketingMediaField
            label="About image"
            description="Optional photo beside the company story"
            value={section.imageUrl ?? ""}
            onChange={(v) => {
              commitMedia({ ...config, about: { ...section, imageUrl: v } });
            }}
            mediaType="image"
            uploadSubdir="about-story"
            uploadScope={uploadScope}
            layout="hero"
          />
        </EditorFieldSpan>
        <Input
          label="Philosophy title"
          value={section.philosophyTitle ?? ""}
          onChange={(v) => patch({ philosophyTitle: v })}
        />
        <EditorFieldSpan>
          <Input
            label="Philosophy body"
            value={section.philosophyBody ?? ""}
            onChange={(v) => patch({ philosophyBody: v })}
          />
        </EditorFieldSpan>
        <Input
          label="Differentiators title"
          value={section.differentTitle ?? ""}
          onChange={(v) => patch({ differentTitle: v })}
        />
        <Input
          label="What we do title"
          value={section.whatWeDoTitle ?? ""}
          onChange={(v) => patch({ whatWeDoTitle: v })}
        />
        <EditorFieldSpan>
          <Input
            label="What we do body"
            value={section.whatWeDoBody ?? ""}
            onChange={(v) => patch({ whatWeDoBody: v })}
          />
        </EditorFieldSpan>
        <Input
          label="Team section title"
          value={section.teamTitle ?? ""}
          onChange={(v) => patch({ teamTitle: v })}
        />
      </EditorFieldsGrid>

      <EditorSectionNote>Key features / what makes you different</EditorSectionNote>
      <EditorItemList
        onAdd={() =>
          commitPatch({
            features: [...(section.features ?? []), emptyAboutFeature()],
          })
        }
        addLabel="+ Add differentiator"
      >
        {(section.features ?? []).map((feature, i) => (
          <AboutFeatureEditorItem
            key={feature.id || `feature-${i}`}
            feature={feature}
            index={i}
            config={config}
            section={section}
            onChange={onChange}
            onRemove={() =>
              commitPatch({
                features: (section.features ?? []).filter((_, idx) => idx !== i),
              })
            }
          />
        ))}
      </EditorItemList>

      <EditorSectionNote>Team members (photo, name, role — Mastermind grid)</EditorSectionNote>
      <EditorItemList
        onAdd={() =>
          commitPatch({
            members: [...(section.members ?? []), emptyAboutMember()],
          })
        }
        addLabel="+ Add team member"
      >
        {(section.members ?? []).map((member, i) => (
          <AboutMemberEditorItem
            key={member.id || `member-${i}`}
            member={member}
            index={i}
            config={config}
            section={section}
            onChange={onChange}
            uploadScope={uploadScope}
            onPersist={commitMedia}
            onRemove={() =>
              commitPatch({
                members: (section.members ?? []).filter((_, idx) => idx !== i),
              })
            }
          />
        ))}
      </EditorItemList>

      <EditorSectionNote>Bottom CTA band (optional)</EditorSectionNote>
      <EditorFieldsGrid>
        <Input
          label="CTA eyebrow"
          value={section.ctaEyebrow ?? ""}
          onChange={(v) => patch({ ctaEyebrow: v })}
        />
        <Input
          label="Online CTA title"
          value={section.onlineCtaTitle ?? ""}
          onChange={(v) => patch({ onlineCtaTitle: v })}
        />
        <EditorFieldSpan>
          <Input
            label="Online CTA body"
            value={section.onlineCtaBody ?? ""}
            onChange={(v) => patch({ onlineCtaBody: v })}
          />
        </EditorFieldSpan>
        <Input
          label="Online CTA label"
          value={section.onlineCtaLabel ?? ""}
          onChange={(v) => patch({ onlineCtaLabel: v })}
        />
        <Input
          label="Online CTA link"
          value={section.onlineCtaHref ?? ""}
          onChange={(v) => patch({ onlineCtaHref: v })}
        />
        <Input
          label="Franchise CTA title"
          value={section.franchiseCtaTitle ?? ""}
          onChange={(v) => patch({ franchiseCtaTitle: v })}
        />
        <EditorFieldSpan>
          <Input
            label="Franchise CTA body"
            value={section.franchiseCtaBody ?? ""}
            onChange={(v) => patch({ franchiseCtaBody: v })}
          />
        </EditorFieldSpan>
        <Input
          label="Franchise CTA label"
          value={section.franchiseCtaLabel ?? ""}
          onChange={(v) => patch({ franchiseCtaLabel: v })}
        />
        <Input
          label="Franchise CTA link"
          value={section.franchiseCtaHref ?? ""}
          onChange={(v) => patch({ franchiseCtaHref: v })}
        />
      </EditorFieldsGrid>
    </>
  );
}

function AboutFeatureEditorItem({
  feature,
  index,
  config,
  section,
  onChange,
  onRemove,
}: {
  feature: HomepageAboutFeature;
  index: number;
  config: HomepageConfig;
  section: NonNullable<HomepageConfig["about"]>;
  onChange: (config: HomepageConfig) => void;
  onRemove: () => void;
}) {
  const update = (patch: Partial<HomepageAboutFeature>) => {
    const features = [...(section.features ?? [])];
    features[index] = { ...feature, ...patch };
    onChange({ ...config, about: { ...section, features } });
  };

  return (
    <EditorItemPanel title={`Differentiator ${index + 1}`} onRemove={onRemove}>
      <EditorFieldsGrid>
        <Input label="Title" value={feature.title} onChange={(v) => update({ title: v })} />
        <EditorFieldSpan>
          <Input label="Body" value={feature.body} onChange={(v) => update({ body: v })} />
        </EditorFieldSpan>
      </EditorFieldsGrid>
    </EditorItemPanel>
  );
}

function AboutMemberEditorItem({
  member,
  index,
  config,
  section,
  onChange,
  uploadScope,
  onPersist,
  onRemove,
}: {
  member: HomepageAboutMember;
  index: number;
  config: HomepageConfig;
  section: NonNullable<HomepageConfig["about"]>;
  onChange: (config: HomepageConfig) => void;
  uploadScope: MarketingUploadScope;
  onPersist: (config: HomepageConfig) => void;
  onRemove: () => void;
}) {
  const update = (patch: Partial<HomepageAboutMember>, persist = false) => {
    const members = [...(section.members ?? [])];
    members[index] = { ...member, ...patch };
    const next = { ...config, about: { ...section, members } };
    if (persist) onPersist(next);
    else onChange(next);
  };

  return (
    <EditorItemPanel title={member.name || `Member ${index + 1}`} onRemove={onRemove}>
      <EditorFieldsGrid>
        <Input label="Name" value={member.name} onChange={(v) => update({ name: v })} />
        <Input label="Role" value={member.role} onChange={(v) => update({ role: v })} />
        <EditorFieldSpan>
          <MarketingMediaField
            label="Photo"
            description="Portrait photo for the team grid"
            value={member.photoUrl}
            onChange={(v) => update({ photoUrl: v }, true)}
            mediaType="image"
            uploadSubdir={`about-member-${member.id || index}`}
            uploadScope={uploadScope}
            layout="hero"
          />
        </EditorFieldSpan>
      </EditorFieldsGrid>
    </EditorItemPanel>
  );
}
