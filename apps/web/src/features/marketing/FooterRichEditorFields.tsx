import { Input } from "@edunudg/ui";
import type { HomepageConfig } from "@/types/homepage";
import { formatPresenceCitiesInput, parsePresenceCitiesInput } from "@/lib/marketingFooterHelpers";
import {
  EditorFieldSpan,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
} from "@/features/marketing/HomepageEditorShell";

type Props = {
  config: HomepageConfig;
  onChange: (config: HomepageConfig) => void;
};

export function FooterRichEditorFields({ config, onChange }: Props) {
  const rich = config.footer.rich ?? {};
  const brandStats = rich.brandStats ?? {};
  const presence = rich.presence ?? [];

  const updateRich = (patch: Partial<NonNullable<HomepageConfig["footer"]["rich"]>>) => {
    onChange({
      ...config,
      footer: {
        ...config.footer,
        rich: { ...rich, ...patch },
      },
    });
  };

  return (
    <>
      <EditorFieldsGrid>
        <Input
          label="Franchise count (display)"
          value={brandStats.franchiseCount ?? ""}
          onChange={(franchiseCount) =>
            updateRich({ brandStats: { ...brandStats, franchiseCount: franchiseCount || undefined } })
          }
          placeholder="e.g. 12+"
        />
        <Input
          label="Student count (display)"
          value={brandStats.studentCount ?? ""}
          onChange={(studentCount) =>
            updateRich({ brandStats: { ...brandStats, studentCount: studentCount || undefined } })
          }
          placeholder="e.g. 20k+"
        />
      </EditorFieldsGrid>

      <EditorItemList
        onAdd={() =>
          updateRich({
            presence: [...presence, { region: "New region", cities: [] }],
          })
        }
        addLabel="+ Add presence region"
      >
        {presence.map((region, i) => (
          <EditorItemPanel
            key={`presence-${i}`}
            title={`Region ${i + 1}`}
            onRemove={() => updateRich({ presence: presence.filter((_, idx) => idx !== i) })}
            removeLabel="Remove region"
          >
            <EditorFieldsGrid>
              <Input
                label="Region name"
                value={region.region}
                onChange={(v) => {
                  const next = [...presence];
                  next[i] = { ...region, region: v };
                  updateRich({ presence: next });
                }}
              />
              <EditorFieldSpan>
                <Input
                  label="Cities (comma-separated)"
                  value={formatPresenceCitiesInput(region.cities)}
                  onChange={(v) => {
                    const next = [...presence];
                    next[i] = { ...region, cities: parsePresenceCitiesInput(v) };
                    updateRich({ presence: next });
                  }}
                  placeholder="Pune, Satara, Sangli"
                />
              </EditorFieldSpan>
            </EditorFieldsGrid>
          </EditorItemPanel>
        ))}
      </EditorItemList>
    </>
  );
}
