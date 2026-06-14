import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { StudentMobileChrome } from "@/features/learn/components/StudentMobileChrome";
import { useStudentBreakpoint } from "@/features/learn/hooks/useStudentBreakpoint";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { studentNavSections, signOutNavItem, supportNavItem } from "@/lib/portalNav";
import { resolveShellProductName } from "@/lib/portalBranding";
import { displayUserFromAuth } from "@/lib/portalUser";
import { fetchStudentLearnHome, StudentLearnRpcError } from "@/lib/studentLearnApi";
import "@/features/learn/studentPortal.css";

export function StudentLearnLayout() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const tenant = useTenant();
  const { isMobile } = useStudentBreakpoint();
  const { data: branding } = usePortalBranding();
  const shell = resolveShellProductName(
    tenant.portalType,
    branding ?? {
      brandId: null,
      brandSlug: null,
      brandName: null,
      brandLogoUrl: null,
      centerId: null,
      centerSlug: null,
      centerName: null,
      loginHeadline: null,
      loginSubtext: null,
    },
    tenant.brandSlug,
    tenant.centerSlug
  );
  const authProfile = displayUserFromAuth(user);

  const studentProfile = useQuery({
    queryKey: ["student-learn-home", tenant.brandId],
    enabled: !!tenant.brandId,
    queryFn: () => fetchStudentLearnHome(tenant.brandId!),
    retry: (_, err) => !(err instanceof StudentLearnRpcError),
    staleTime: 60_000,
  });

  const student = studentProfile.data?.student;
  const studentCode = student?.student_code;
  const avatarUrl = student?.profile.photo_url;

  return (
    <AppShell
      productName={shell.productName}
      logoUrl={shell.logoUrl}
      portalLabel={`Learn · ${shell.productName}`}
      portalTagline="Student portal"
      user={{
        name: student?.full_name ?? authProfile.name,
        email: authProfile.email,
        subtitle: studentCode ? `Student ID: #${studentCode.replace(/^#/, "")}` : authProfile.email,
        avatarUrl,
      }}
      navSections={studentNavSections(pathname)}
      footerItems={[supportNavItem(), signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
      showWelcome={false}
      shellVariant="student"
      surface="backend"
    >
      <div className={`ed-student-portal${isMobile ? " ed-student-portal--mobile" : ""}`}>
        <Outlet />
        {isMobile ? <StudentMobileChrome /> : null}
      </div>
    </AppShell>
  );
}
