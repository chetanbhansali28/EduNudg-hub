import { Link } from "react-router-dom";
import { PageTitle } from "@edunudg/ui";

type Props = {
  brandName?: string | null;
};

export function StudentEnrollmentBlockedPage({ brandName }: Props) {
  return (
    <>
      <PageTitle>Enrollment required</PageTitle>
      <div className="ed-sp-blocked">
        <div className="ed-sp-blocked__icon" aria-hidden>
          !
        </div>
        <h2 className="ed-sp-empty__title">Almost there</h2>
        <p className="ed-sp-empty__text">
          You are not linked to an active center enrollment yet. Contact {brandName ?? "your brand"} or
          your franchise center to complete setup.
        </p>
        <p className="ed-sp-empty__text" style={{ marginTop: "0.75rem" }}>
          Once your center converts your enrollment and invites you to the student portal, sign in with the
          email they registered for you.
        </p>
        <p style={{ marginTop: "1.25rem" }}>
          <Link className="ed-sp-chip-link" to="/profile">
            View account
          </Link>
        </p>
      </div>
    </>
  );
}
