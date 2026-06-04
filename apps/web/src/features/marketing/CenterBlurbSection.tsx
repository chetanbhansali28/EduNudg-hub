import type { CenterPublicProfile } from "@/lib/centerLandingApi";

type Props = {
  profile: CenterPublicProfile;
};

/** FR-C03 — center facts above registration form on center public host. */
export function CenterBlurbSection({ profile }: Props) {
  const title = profile.displayName ?? profile.centerName;
  const location = [profile.city, profile.pincode].filter(Boolean).join(" · ");

  return (
    <section id="about-center" data-nav-theme="light" className="novu-center-blurb">
      <div className="novu-center-blurb__inner">
        <p className="novu-center-blurb__eyebrow">{profile.brandName}</p>
        <h2 className="novu-center-blurb__title">{title}</h2>
        {profile.shortDescription ? (
          <p className="novu-center-blurb__body">{profile.shortDescription}</p>
        ) : (
          <p className="novu-center-blurb__body">
            Welcome to {title}. Register below and our instructors will call you on WhatsApp to schedule your
            child&apos;s free trial class.
          </p>
        )}
        <ul className="novu-center-blurb__facts">
          {location && <li>{location}</li>}
          {profile.addressLine1 && <li>{profile.addressLine1}</li>}
          {profile.contactPhone && <li>Call / WhatsApp: {profile.contactPhone}</li>}
        </ul>
      </div>
    </section>
  );
}
