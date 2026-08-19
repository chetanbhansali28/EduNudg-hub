import {
  isLevelSelected,
  isProgramFullySelected,
  isProgramPartiallySelected,
  toggleLevelSelection,
  toggleProgramSelection,
  type BrandProgramOption,
  type CatalogCurriculumLink,
} from "@/lib/merchandiseCurriculum";

type Props = {
  programs: BrandProgramOption[];
  selectedLinks: CatalogCurriculumLink[];
  onChange: (links: CatalogCurriculumLink[]) => void;
  disabled?: boolean;
};

export function MerchandiseCurriculumPicker({ programs, selectedLinks, onChange, disabled }: Props) {
  if (programs.length === 0) {
    return (
      <p className="ed-text-sm ed-muted">
        Add a curriculum course first. Franchise shops only show merchandise tied to courses assigned to that
        center.
      </p>
    );
  }

  return (
    <div className="ed-brand-merch-curriculum">
      <p className="ed-brand-merch-curriculum__label">Curriculum</p>
      <p className="ed-text-sm ed-muted ed-brand-merch-curriculum__hint">
        Tag courses and levels. Franchise centers only see this SKU when one of these courses is assigned to
        them.
      </p>
      <div className="ed-brand-merch-curriculum__grid" role="group" aria-label="Curriculum">
        {programs.map((program) => {
          const programOn = isProgramFullySelected(selectedLinks, program);
          const programPartial = !programOn && isProgramPartiallySelected(selectedLinks, program.id);
          return (
            <div key={program.id} className="ed-brand-merch-curriculum__course">
              <button
                type="button"
                className="ed-brand-merch-curriculum__toggle"
                aria-pressed={programOn || programPartial}
                disabled={disabled}
                onClick={() => onChange(toggleProgramSelection(selectedLinks, program))}
              >
                {programOn ? "✓ " : ""}
                {program.name}
              </button>
              {program.levels.length > 0 ? (
                <div
                  className="ed-brand-merch-curriculum__levels"
                  role="group"
                  aria-label={`${program.name} levels`}
                >
                  {program.levels.map((level) => {
                    const on = isLevelSelected(selectedLinks, program.id, level.id);
                    return (
                      <button
                        key={level.id}
                        type="button"
                        className="ed-brand-merch-curriculum__toggle ed-brand-merch-curriculum__toggle--level"
                        aria-pressed={on}
                        disabled={disabled}
                        onClick={() => onChange(toggleLevelSelection(selectedLinks, program.id, level.id))}
                      >
                        {on ? "✓ " : ""}
                        {level.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
