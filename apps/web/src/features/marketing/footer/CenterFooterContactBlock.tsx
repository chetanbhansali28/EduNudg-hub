import { centerPhoneHref, type CenterFooterContact } from "@/lib/centerFooterContact";

type Props = {
  contact: CenterFooterContact;
  heading?: string;
  headingClassName?: string;
  addressClassName?: string;
};

export function CenterFooterContactBlock({
  contact,
  heading = "This center",
  headingClassName = "mkt-footer-shell__heading",
  addressClassName,
}: Props) {
  return (
    <div>
      <h3 className={headingClassName}>{heading}</h3>
      <address className={addressClassName}>
        {contact.addressLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {contact.phone ? (
          <p>
            <a href={centerPhoneHref(contact.phone)}>{contact.phone}</a>
          </p>
        ) : null}
      </address>
    </div>
  );
}
