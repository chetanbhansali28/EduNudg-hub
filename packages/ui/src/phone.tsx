import type { MouseEvent, ReactNode } from "react";
import { telHref } from "./phoneLinks";

export { telHref } from "./phoneLinks";

const DIAL_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.33 1.7.62 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.19a2 2 0 0 1 2.11-.45c.8.29 1.64.5 2.5.62A2 2 0 0 1 22 16.92z" />
  </svg>
);

export function PhoneLink({
  phone,
  className = "ed-phone-link",
  fallback = "—",
  onClick,
  showDialIcon = false,
}: {
  phone: string | null | undefined;
  className?: string;
  fallback?: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  showDialIcon?: boolean;
}) {
  const display = phone?.trim();
  if (!display) return <>{fallback}</>;

  const href = telHref(display);
  if (!href) return <>{display}</>;

  return (
    <a href={href} className={className} onClick={onClick}>
      {showDialIcon ? DIAL_ICON : null}
      {display}
    </a>
  );
}

export function PhoneDialButton({
  phone,
  className = "ed-field__dial",
  label,
}: {
  phone: string | null | undefined;
  className?: string;
  label?: string;
}) {
  const href = telHref(phone);
  if (!href) return null;

  const display = phone?.trim() ?? "";
  return (
    <a href={href} className={className} aria-label={label ?? `Call ${display}`}>
      {DIAL_ICON}
    </a>
  );
}

export type ShippingAddressPreviewParts = {
  name?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
};

function joinAddressSegments(parts: ReactNode[], separator = " · ") {
  return parts.reduce<ReactNode[]>((nodes, part, index) => {
    if (index > 0) nodes.push(separator);
    nodes.push(part);
    return nodes;
  }, []);
}

export function ShippingAddressPreview({
  address,
  prefix,
  emptyLabel = "Address not available.",
}: {
  address: ShippingAddressPreviewParts | null;
  prefix?: ReactNode;
  emptyLabel?: string;
}) {
  if (!address) {
    return (
      <>
        {prefix}
        {emptyLabel}
      </>
    );
  }

  const cityLine = [address.city, address.state, address.pincode].filter(Boolean).join(", ");
  const segments: ReactNode[] = [];

  if (address.name?.trim()) segments.push(address.name.trim());
  if (address.phone?.trim()) segments.push(<PhoneLink key="phone" phone={address.phone} />);
  if (address.addressLine1?.trim()) segments.push(address.addressLine1.trim());
  if (cityLine) segments.push(cityLine);
  if (address.country?.trim()) segments.push(address.country.trim());

  if (segments.length === 0) {
    return (
      <>
        {prefix}
        Incomplete address.
      </>
    );
  }

  return (
    <>
      {prefix}
      {joinAddressSegments(segments)}
    </>
  );
}

export function DetailPhoneField({
  label,
  value,
  className = "ed-detail-phone-field",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value?.trim()) return null;

  return (
    <div className={className}>
      <dt className="ed-detail-phone-field__label">{label}</dt>
      <dd className="ed-detail-phone-field__value">
        <PhoneLink phone={value} />
      </dd>
    </div>
  );
}
