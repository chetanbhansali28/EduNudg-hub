import { PageTitle, Card } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { displayUserFromAuth } from "@/lib/portalUser";

export function StudentProfilePage() {
  const { user } = useAuth();
  const profile = displayUserFromAuth(user);

  return (
    <>
      <PageTitle>Profile</PageTitle>
      <Card title="Account">
        <p>
          <strong>{profile.name}</strong>
        </p>
        {profile.email && <p className="ed-text-sm ed-muted">{profile.email}</p>}
      </Card>
    </>
  );
}
