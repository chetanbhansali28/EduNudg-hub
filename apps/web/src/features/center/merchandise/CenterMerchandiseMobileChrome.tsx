import { IconHome, IconStore, IconUsers, BottomNav } from "@edunudg/ui";
import { useLocation } from "react-router-dom";

const ICONS = {
  home: <IconHome width={22} height={22} />,
  store: <IconStore width={22} height={22} />,
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  profile: <IconUsers width={22} height={22} />,
};

export function CenterMerchandiseMobileChrome() {
  const { pathname, search } = useLocation();
  const onMerchandise = pathname.startsWith("/app/merchandise");
  const tab = new URLSearchParams(search).get("tab");
  const onOrders = tab === "orders";

  if (!onMerchandise) return null;

  return (
    <BottomNav
      navLabel="Store navigation"
      items={[
        { href: "/app", label: "Home", icon: ICONS.home, active: false },
        {
          href: "/app/merchandise",
          label: "Store",
          icon: ICONS.store,
          active: onMerchandise && !onOrders,
        },
        {
          href: "/app/merchandise?tab=orders",
          label: "Orders",
          icon: ICONS.orders,
          active: onOrders,
        },
        { href: "/app/settings", label: "Profile", icon: ICONS.profile, active: false },
      ]}
    />
  );
}
