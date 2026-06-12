export function StudentTabBar<T extends string>({
  tabs,
  value,
  onChange,
  labels,
}: {
  tabs: readonly T[];
  value: T;
  onChange: (tab: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="ed-sp-tabs" role="tablist" aria-label="Filter">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          className={["ed-sp-tabs__btn", value === tab ? "ed-sp-tabs__btn--active" : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onChange(tab)}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
