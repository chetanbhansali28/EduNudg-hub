const ICONS: Record<string, string> = {
  shield: "shield",
  network: "hub",
  check: "check_circle",
  school: "school",
  wallet: "account_balance_wallet",
  calendar: "calendar_month",
  chart: "bar_chart",
  search: "search",
  grid: "grid_view",
  message: "chat",
  sync: "sync",
  globe: "public",
  how_to_reg: "how_to_reg",
  event_available: "event_available",
  trending_up: "trending_up",
  chat: "chat",
};

type Props = {
  iconKey: string;
  className?: string;
};

export function EnterpriseIcon({ iconKey, className = "" }: Props) {
  const name = ICONS[iconKey] ?? "circle";
  return (
    <span className={`ent-icon material-symbols-outlined ${className}`.trim()} aria-hidden>
      {name}
    </span>
  );
}
