import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { PlatformLayout } from "@/features/platform/PlatformLayout";
import { CommandCenter } from "@/features/platform/CommandCenter";
import { BrandsPage } from "@/features/platform/BrandsPage";
import { BrandDetailPage } from "@/features/platform/BrandDetailPage";
import { SubscriptionsPage } from "@/features/platform/SubscriptionsPage";
import { RevenuePage } from "@/features/platform/RevenuePage";
import { AuditLogsPage } from "@/features/platform/AuditLogsPage";
import { SettingsPage } from "@/features/platform/SettingsPage";
import { BrandLandingPage } from "@/features/brand/BrandLandingPage";
import { BrandLayout } from "@/features/brand/BrandLayout";
import { BrandPublicLayout } from "@/features/brand/BrandPublicLayout";
import { BrandDashboard } from "@/features/brand/BrandDashboard";
import { CurriculumPage } from "@/features/brand/CurriculumPage";
import { CentersPage } from "@/features/brand/CentersPage";
import { RoyaltiesPage } from "@/features/brand/RoyaltiesPage";
import { BrandAnalyticsPage } from "@/features/brand/BrandAnalyticsPage";
import { BrandSettingsPage } from "@/features/brand/BrandSettingsPage";
import { CenterLandingPage } from "@/features/center/CenterLandingPage";
import { CenterPublicLayout } from "@/features/center/CenterPublicLayout";
import { CenterLayout } from "@/features/center/CenterLayout";
import { CenterDashboard } from "@/features/center/CenterDashboard";
import { AdmissionsPage } from "@/features/center/AdmissionsPage";
import { StudentsPage } from "@/features/center/StudentsPage";
import { BatchesPage } from "@/features/center/BatchesPage";
import { AttendancePage } from "@/features/center/AttendancePage";
import { FeesPage } from "@/features/center/FeesPage";
import { InventoryPage } from "@/features/center/InventoryPage";
import { MarketingHomePage } from "@/features/marketing/MarketingHomePage";
import { MarketingPublicLayout } from "@/features/marketing/MarketingPublicLayout";
import { HomepageEditorPage } from "@/features/platform/HomepageEditorPage";
import { StudentPortalPage } from "@/features/learn/StudentPortalPage";
import { ParentPortalPage } from "@/features/learn/ParentPortalPage";
import { ThemeProvider } from "@edunudg/ui";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">Loading…</p>
        </div>
      </ThemeProvider>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const tenant = useTenant();

  if (tenant.portalType === "learn") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<StudentPortalPage />} />
      </Routes>
    );
  }

  if (tenant.portalType === "parents") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<ParentPortalPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {tenant.portalType === "platform" && (
        <>
          <Route element={<MarketingPublicLayout />}>
            <Route path="/" element={<MarketingHomePage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <PlatformLayout />
              </RequireAuth>
            }
          >
            <Route index element={<CommandCenter />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="brands/:brandSlug" element={<BrandDetailPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="homepage" element={<HomepageEditorPage />} />
          </Route>
        </>
      )}

      {tenant.portalType === "brand" && (
        <>
          <Route element={<BrandPublicLayout />}>
            <Route path="/" element={<BrandLandingPage />} />
          </Route>
          <Route
            path="/app"
            element={
              <RequireAuth>
                <BrandLayout />
              </RequireAuth>
            }
          >
            <Route index element={<BrandDashboard />} />
            <Route path="curriculum" element={<CurriculumPage />} />
            <Route path="centers" element={<CentersPage />} />
            <Route path="royalties" element={<RoyaltiesPage />} />
            <Route path="analytics" element={<BrandAnalyticsPage />} />
            <Route path="settings" element={<BrandSettingsPage />} />
          </Route>
        </>
      )}

      {tenant.portalType === "center" && (
        <>
          <Route element={<CenterPublicLayout />}>
            <Route path="/" element={<CenterLandingPage />} />
          </Route>
          <Route
            path="/app"
            element={
              <RequireAuth>
                <CenterLayout />
              </RequireAuth>
            }
          >
            <Route index element={<CenterDashboard />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="fees" element={<FeesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
          <Route path="/admissions" element={<Navigate to="/app/admissions" replace />} />
          <Route path="/students" element={<Navigate to="/app/students" replace />} />
          <Route path="/batches" element={<Navigate to="/app/batches" replace />} />
          <Route path="/attendance" element={<Navigate to="/app/attendance" replace />} />
          <Route path="/fees" element={<Navigate to="/app/fees" replace />} />
          <Route path="/inventory" element={<Navigate to="/app/inventory" replace />} />
        </>
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
