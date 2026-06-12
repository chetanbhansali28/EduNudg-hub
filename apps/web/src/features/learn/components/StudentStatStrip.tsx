type Stat = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StudentStatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="ed-sp-stat-grid" role="list">
      {stats.map((stat) => (
        <article key={stat.label} className="ed-sp-stat" role="listitem">
          <p className="ed-sp-stat__label">{stat.label}</p>
          <p className="ed-sp-stat__value">{stat.value}</p>
          {stat.hint ? <p className="ed-sp-stat__hint">{stat.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}
