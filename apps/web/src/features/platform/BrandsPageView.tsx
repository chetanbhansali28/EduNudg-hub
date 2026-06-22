import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DirectoryBrandBackendButton,
  DirectoryBrandCard,
  DirectoryBrandList,
  DirectoryBrandRow,
  DirectoryEmptyState,
  DirectoryFab,
  DirectoryIconAction,
  DirectoryListToolbar,
  DirectoryMobileActionBar,
  DirectoryMobileToolbar,
  DirectoryPageHeader,
  DirectoryPagination,
  DirectorySectionHeader,
  DirectoryShell,
  DirectoryStatCard,
  DirectoryStatGrid,
  DirectoryStatusBadge,
  DirectoryVisibility,
  MutationError,
} from "@edunudg/ui";
import { brandAdminPath } from "@/lib/adminPaths";
import { portalTargetFromDomain } from "@/lib/brandPortalUrl";
import { openPortalAsPlatformAdmin, openPortalBackendFallback } from "@/lib/portalHandoffApi";
import type { PlatformBrandRow, PlatformBrandsHome } from "@/lib/platformBrandsHelpers";
import {
  BRAND_SORT_OPTIONS,
  brandStatusLabel,
  brandStatusTone,
  brandSubtitle,
  brandsPaginationSummary,
  formatGrowthPercent,
  formatStudentCount,
  pendingReviewLabel,
  resolveBrandsList,
  shouldShowBrandsListControls,
  type BrandSortKey,
} from "@/lib/platformBrandsHelpers";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";
import { ManualPlatformBrandSignupCard } from "@/features/platform/brandSignups/ManualPlatformBrandSignupCard";
import "./brandsPage.css";

const ICON_CLIPBOARD = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11v6M9 14h6" />
  </svg>
);

const ICON_EDIT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const ICON_DELETE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

const ICON_BACKEND = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const ICON_STUDENTS = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ICON_GROWTH = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

function BrandIcon({ brand }: { brand: PlatformBrandRow }) {
  if (brand.logo_url) {
    return <img src={brand.logo_url} alt="" />;
  }

  return <span>{brand.name.trim().charAt(0).toUpperCase() || "B"}</span>;
}

function BrandThumbnail({ brand }: { brand: PlatformBrandRow }) {
  if (brand.logo_url) {
    return <img src={brand.logo_url} alt="" />;
  }

  return (
    <span className="ed-brands-page__placeholder-icon" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      </svg>
    </span>
  );
}

function usePortalOpen() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openBrandBackend = (brand: PlatformBrandRow) => {
    const target = portalTargetFromDomain("brand", `${brand.slug}.localhost`, brand.slug);
    if (!target) return;
    setPendingId(brand.id);
    void openPortalAsPlatformAdmin(target)
      .catch(() => {
        openPortalBackendFallback(target);
      })
      .finally(() => setPendingId(null));
  };

  return { pendingId, openBrandBackend };
}

function BrandsDashboardStats({ data }: { data: PlatformBrandsHome }) {
  return (
    <DirectoryStatGrid layout="row">
      <DirectoryStatCard
        label="Pending review"
        value={pendingReviewLabel(data.pendingSignups)}
        icon={ICON_CLIPBOARD}
        iconTone="purple"
      />
      <DirectoryStatCard
        label="Total Students"
        value={formatStudentCount(data.totalStudents)}
        icon={ICON_STUDENTS}
        iconTone="blue"
      />
      <DirectoryStatCard
        label="Monthly Growth"
        value={formatGrowthPercent(data.monthlyGrowthPercent)}
        icon={ICON_GROWTH}
        iconTone="purple"
      />
    </DirectoryStatGrid>
  );
}

function useBrandsListState(brands: PlatformBrandRow[]) {
  const showListControls = shouldShowBrandsListControls(brands.length);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BrandSortKey>("name-asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const list = useMemo(
    () => resolveBrandsList(brands, { showControls: showListControls, search, sort, page }),
    [brands, showListControls, search, sort, page]
  );

  return {
    showListControls,
    search,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
    list,
  };
}

export function BrandsPageView({
  data,
  error,
  onDeleteBrand,
  deletePending = false,
}: {
  data: PlatformBrandsHome;
  error: string | null;
  onDeleteBrand: (brandId: string) => void;
  deletePending?: boolean;
}) {
  const navigate = useNavigate();
  const manualSignupRef = useRef<HTMLDivElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(data.brands[0]?.id ?? null);
  const [deleteTarget, setDeleteTarget] = useState<PlatformBrandRow | null>(null);
  const { pendingId, openBrandBackend } = usePortalOpen();
  const { showListControls, search, setSearch, sort, setSort, page, setPage, list } = useBrandsListState(data.brands);

  const openAddBrand = () => setAddOpen(true);

  useEffect(() => {
    if (!addOpen) return;
    const frame = window.requestAnimationFrame(() => {
      manualSignupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [addOpen]);

  const listToolbar = showListControls ? (
    <DirectoryListToolbar
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search brands…"
      sortValue={sort}
      onSortChange={(value) => setSort(value as BrandSortKey)}
      sortOptions={BRAND_SORT_OPTIONS}
    />
  ) : null;

  const listPagination = showListControls ? (
    <DirectoryPagination
      summary={brandsPaginationSummary(list)}
      onPrevious={() => setPage((current) => Math.max(1, current - 1))}
      onNext={() => setPage((current) => Math.min(list.pageCount, current + 1))}
      disablePrevious={list.page <= 1}
      disableNext={list.page >= list.pageCount}
    />
  ) : null;

  const renderMobileActions = (brand: PlatformBrandRow) => (
    <DirectoryMobileActionBar
      items={[
        {
          key: "backend",
          label: "Backend",
          icon: ICON_BACKEND,
          onClick: () => openBrandBackend(brand),
        },
        {
          key: "edit",
          label: "Edit",
          icon: ICON_EDIT,
          onClick: () => navigate(brandAdminPath(brand.slug)),
        },
        {
          key: "delete",
          label: "Delete",
          icon: ICON_DELETE,
          tone: "danger",
          onClick: () => setDeleteTarget(brand),
        },
      ]}
    />
  );

  return (
    <DirectoryShell className="ed-brands-page">
      <MutationError message={error} />

      <DirectoryVisibility
        mobile={
          <>
            <DirectoryMobileToolbar title="Brands" />

            <BrandsDashboardStats data={data} />

            <DirectorySectionHeader title="Active Brands" />
            {listToolbar}
            {list.items.length === 0 ? (
              <DirectoryEmptyState message={showListControls && search ? "No brands match your search." : "No brands yet."} />
            ) : (
              list.items.map((brand) => (
                <DirectoryBrandCard
                  key={brand.id}
                  thumbnail={<BrandThumbnail brand={brand} />}
                  name={brand.name}
                  subtitle={brandSubtitle(brand.name, brand.slug)}
                  status={<DirectoryStatusBadge label={brandStatusLabel(brand.status)} tone={brandStatusTone(brand.status)} />}
                  expanded={expandedId === brand.id}
                  onToggle={() => setExpandedId((current) => (current === brand.id ? null : brand.id))}
                  href={brandAdminPath(brand.slug)}
                  actions={expandedId === brand.id ? renderMobileActions(brand) : undefined}
                />
              ))
            )}
            {listPagination}

            <DirectoryFab label="Add brand" onClick={openAddBrand} />
          </>
        }
        desktop={
          <>
            <DirectoryPageHeader
              title="Brands"
              subtitle="Manage and monitor all active brand ecosystems."
              action={
                <button type="button" className="ed-directory-header__cta" onClick={openAddBrand}>
                  + Add brand
                </button>
              }
            />

            <BrandsDashboardStats data={data} />

            <DirectorySectionHeader title="Active Brands" />
            {listToolbar}
            {list.items.length === 0 ? (
              <DirectoryEmptyState message={showListControls && search ? "No brands match your search." : "No brands yet."} />
            ) : (
              <DirectoryBrandList>
                {list.items.map((brand) => (
                  <DirectoryBrandRow
                    key={brand.id}
                    icon={<BrandIcon brand={brand} />}
                    name={brand.name}
                    slug={brand.slug}
                    slugHref={brandAdminPath(brand.slug)}
                    nameHref={brandAdminPath(brand.slug)}
                    status={
                      <DirectoryStatusBadge label={brandStatusLabel(brand.status)} tone={brandStatusTone(brand.status)} />
                    }
                    backendAction={
                      <DirectoryBrandBackendButton
                        onClick={() => openBrandBackend(brand)}
                        pending={pendingId === brand.id}
                      />
                    }
                    editAction={
                      <DirectoryIconAction label="Edit" onClick={() => navigate(brandAdminPath(brand.slug))}>
                        {ICON_EDIT}
                      </DirectoryIconAction>
                    }
                    deleteAction={
                      <DirectoryIconAction label="Delete" tone="danger" onClick={() => setDeleteTarget(brand)}>
                        {ICON_DELETE}
                      </DirectoryIconAction>
                    }
                  />
                ))}
              </DirectoryBrandList>
            )}
            {listPagination}
          </>
        }
      />

      <div ref={manualSignupRef} className="ed-brands-page__manual-signup">
        <ManualPlatformBrandSignupCard open={addOpen} onOpenChange={setAddOpen} hideTrigger />
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteBrand(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Archive this brand?"
        description="Related data remains but the brand is hidden from lists."
        confirmPending={deletePending}
      />
    </DirectoryShell>
  );
}
