import { PhoneLink } from "@edunudg/ui";
import { formatShortDate, studentInitials } from "@/features/learn/studentFormatters";
import { resolveCenterWebsiteUrl } from "@/lib/centerPublicNavUrls";

type Center = {
  display_name: string;
  city: string | null;
  contact_phone: string | null;
  public_url: string;
};

type Enrollment = {
  enrolled_at: string;
  batch_name: string | null;
};

export function CenterInfoCard({
  brandSlug,
  center,
  enrollment,
}: {
  brandSlug: string;
  center: Center;
  enrollment: Enrollment;
}) {
  const websiteUrl = resolveCenterWebsiteUrl(brandSlug, center.public_url);

  return (
    <div className="ed-sp-center">
      <div className="ed-sp-center__badge" aria-hidden>
        {studentInitials(center.display_name)}
      </div>
      <div>
        <p className="ed-sp-center__name">{center.display_name}</p>
        <p className="ed-sp-center__meta">
          {center.city ? `${center.city} · ` : ""}
          Enrolled {formatShortDate(enrollment.enrolled_at)}
          {enrollment.batch_name ? ` · ${enrollment.batch_name}` : ""}
        </p>
        {center.contact_phone && (
          <p className="ed-sp-center__meta">
            Need help? <PhoneLink phone={center.contact_phone} />
          </p>
        )}
        <div className="ed-sp-center__links">
          {websiteUrl ? (
            <a className="ed-sp-chip-link" href={websiteUrl} target="_blank" rel="noreferrer">
              Center website
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
