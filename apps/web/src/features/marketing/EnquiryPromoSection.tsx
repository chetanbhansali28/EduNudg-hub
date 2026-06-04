import type { ReactNode } from "react";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  perks: string[];
  accent?: "franchise" | "student" | "platform";
  children: ReactNode;
};

export function EnquiryPromoSection({ id, eyebrow, title, subtitle, perks, accent = "student", children }: Props) {
  return (
    <section id={id} data-nav-theme="light" className={`novu-enquiry-promo novu-enquiry-promo--${accent} novu-reveal`}>
      <div className="novu-enquiry-promo__glow" aria-hidden />
      <div className="novu-enquiry-promo__inner">
        <div className="novu-enquiry-promo__copy">
          <p className="novu-enquiry-promo__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="novu-enquiry-promo__subtitle">{subtitle}</p>
          <ul className="novu-enquiry-promo__perks">
            {perks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="novu-enquiry-promo__form-wrap">{children}</div>
      </div>
    </section>
  );
}
