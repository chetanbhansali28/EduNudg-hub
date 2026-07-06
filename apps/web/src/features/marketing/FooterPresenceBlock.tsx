import type { HomepageFooterPresence } from "@/types/homepage";

type Props = {
  presence: HomepageFooterPresence[];
  className?: string;
  regionClassName?: string;
};

export function FooterPresenceBlock({ presence, className, regionClassName }: Props) {
  if (!presence.length) return null;

  return (
    <div className={className}>
      <h3>Our presence</h3>
      {presence.map((region, i) => (
        <div key={`${region.region}-${i}`} className={regionClassName}>
          <strong>{region.region}</strong>
          <p>{region.cities.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
