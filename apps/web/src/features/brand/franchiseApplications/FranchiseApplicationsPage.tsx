import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FilterTabs,
  MutationError,
  PipelinePageHeader,
  PipelineWorkspace,
} from "@edunudg/ui";
import { ManualFranchiseInquiryCard } from "@/features/shared/manualLeads/ManualFranchiseInquiryCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { approveFranchiseInquiry, rejectFranchiseInquiry } from "@/lib/franchiseInquiriesApi";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { initialsFromName } from "@/lib/welcomeMessage";
import {
  filterInquiries,
  formatInquiryListDate,
  formatInquiryRelativeWhen,
  INQUIRY_FILTER_OPTIONS,
  inquiryAvatarTone,
  inquiryCounts,
  inquiryListTitle,
  inquiryLocationLine,
  inquiryMobileLocation,
  inquiryStatusPresentation,
  isPendingInquiry,
  type InquiryFilter,
} from "./franchiseApplicationsHelpers";
import { FranchiseInquiryDetailCard, type FranchiseInquiry } from "./FranchiseInquiryDetailCard";
import "./franchiseApplications.css";

const INQUIRY_SELECT =
  "id, full_name, email, phone_e164, city, state, pincode, address_line, proposed_franchise_name, prior_experience, message, status, rejected_reason, converted_center_id, created_at, updated_at";

const ICON_SEARCH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const ICON_PIN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

function StatusBadge({ label, tone }: ReturnType<typeof inquiryStatusPresentation>) {
  return <span className={`ed-franchise-app-status-badge ed-franchise-app-status-badge--${tone}`}>{label}</span>;
}

export function FranchiseApplicationsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<InquiryFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const addFormRef = useRef<HTMLDivElement>(null);
  const { isDesktop, isMobile } = useOpsBreakpoint();

  const inquiries = useQuery({
    queryKey: ["franchise-inquiries", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_inquiries")
        .select(INQUIRY_SELECT)
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as FranchiseInquiry[];
    },
  });

  const all = inquiries.data ?? [];
  const counts = useMemo(() => inquiryCounts(all), [all]);
  const filtered = useMemo(() => filterInquiries(all, filter, search), [all, filter, search]);
  const selected = all.find((row) => row.id === selectedId) ?? null;
  const now = Date.now();

  const resetActionState = () => {
    setRejectMode(false);
    setRejectReason("");
  };

  const closeDetail = () => {
    setSelectedId(null);
    resetActionState();
  };

  const selectInquiry = (id: string) => {
    setSelectedId(id);
    resetActionState();
  };

  useEffect(() => {
    if (selectedId && !filtered.some((row) => row.id === selectedId)) {
      setSelectedId(null);
      resetActionState();
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (selectedId || filtered.length === 0 || !isDesktop) return;
    setSelectedId(filtered[0]!.id);
  }, [filtered, selectedId, isDesktop]);

  useEffect(() => {
    if (!addFormOpen || !addFormRef.current) return;
    const frame = requestAnimationFrame(() => {
      addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [addFormOpen]);

  const approve = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      clear();
      const { error: err } = await approveFranchiseInquiry(selectedId);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      void qc.invalidateQueries({ queryKey: ["centers", brandId] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (!selectedId || !rejectReason.trim()) return;
      clear();
      const { error: err } = await rejectFranchiseInquiry(selectedId, rejectReason);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const desktopFilterTabs = INQUIRY_FILTER_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    count: counts[option.value],
  }));

  const listEmpty = (
    <div className="ed-franchise-apps-page__empty">
      <p>No franchise applications in this view.</p>
      {filter !== "pending" ? (
        <Button variant="ghost" onClick={() => setFilter("pending")}>
          Show pending review
        </Button>
      ) : null}
    </div>
  );

  const renderDesktopList = () => {
    if (inquiries.isLoading) return <p className="ed-text-sm ed-muted">Loading applications…</p>;
    if (filtered.length === 0) return listEmpty;

    return (
      <div className="ed-franchise-apps-page__desktop-list">
        {filtered.map((row) => {
          const title = inquiryListTitle(row);
          const status = inquiryStatusPresentation(row);
          const location = inquiryLocationLine(row);

          return (
            <button
              key={row.id}
              type="button"
              className={`ed-franchise-app-list-item${row.id === selectedId ? " ed-franchise-app-list-item--selected" : ""}`}
              onClick={() => selectInquiry(row.id)}
            >
              <div className="ed-franchise-app-list-item__head">
                <StatusBadge {...status} />
                <span className="ed-franchise-app-list-item__when">{formatInquiryRelativeWhen(row.created_at, now)}</span>
              </div>
              <p className="ed-franchise-app-list-item__title">{title}</p>
              {location ? (
                <p className="ed-franchise-app-list-item__location">
                  {ICON_PIN}
                  {location}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMobileList = () => {
    if (inquiries.isLoading) return <p className="ed-text-sm ed-muted">Loading applications…</p>;
    if (filtered.length === 0) return listEmpty;

    return (
      <div className="ed-franchise-apps-page__mobile-list">
        {filtered.map((row) => {
          const title = inquiryListTitle(row);
          const status = inquiryStatusPresentation(row);
          const location = inquiryMobileLocation(row);
          const avatarTone = inquiryAvatarTone(title);

          return (
            <button
              key={row.id}
              type="button"
              className="ed-franchise-app-mobile-card"
              onClick={() => selectInquiry(row.id)}
            >
              <div className="ed-franchise-app-mobile-card__head">
                <span className={`ed-franchise-app-mobile-card__avatar ed-franchise-app-mobile-card__avatar--${avatarTone}`}>
                  {initialsFromName(title)}
                </span>
                <div>
                  <div className="ed-franchise-app-mobile-card__title-row">
                    <h3 className="ed-franchise-app-mobile-card__title">{title}</h3>
                    {status.tone === "new" ? <StatusBadge {...status} /> : null}
                  </div>
                  {location ? (
                    <p className="ed-franchise-app-mobile-card__location">
                      {ICON_PIN}
                      {location}
                    </p>
                  ) : null}
                </div>
                <span className="ed-franchise-app-mobile-card__date">{formatInquiryListDate(row.created_at)}</span>
              </div>
              <div className="ed-franchise-app-mobile-card__footer">
                <span className="ed-franchise-app-mobile-card__cta">View Details &gt;</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="ed-franchise-apps-page">
      <PipelinePageHeader
        title="Franchise Applications"
        subtitle="Review and manage incoming center requests."
        actions={<Button onClick={() => setAddFormOpen(true)}>+ Add franchise application</Button>}
      />
      <MutationError message={error} />

      <div className="ed-franchise-apps-page__toolbar">
        <label className="ed-franchise-apps-page__search">
          <span className="ed-franchise-apps-page__search-icon">{ICON_SEARCH}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applications..."
            aria-label="Search applications"
          />
        </label>
        <FilterTabs
          options={desktopFilterTabs}
          value={filter}
          onChange={setFilter}
          aria-label="Application filter"
        />
      </div>

      <PipelineWorkspace
        detailOpen={!!selected}
        list={
          <>
            {isDesktop ? renderDesktopList() : null}
            {isMobile ? renderMobileList() : null}
            {isMobile && !selected ? (
              <aside className="ed-franchise-apps-page__promo" aria-label="Franchise network promotion">
                <h2 className="ed-franchise-apps-page__promo-title">Expand your network</h2>
                <p className="ed-franchise-apps-page__promo-copy">
                  New franchise opportunities in North India are now live.
                </p>
              </aside>
            ) : null}
          </>
        }
        detail={
          selected ? (
            <FranchiseInquiryDetailCard
              inquiry={selected}
              pending={isPendingInquiry(selected)}
              onBack={closeDetail}
              onApprove={() => approve.mutate()}
              onReject={() => {
                setRejectMode(true);
                setRejectReason("");
              }}
              rejectMode={rejectMode}
              rejectReason={rejectReason}
              onRejectReasonChange={setRejectReason}
              onConfirmReject={() => reject.mutate()}
              onCancelAction={resetActionState}
              approvePending={approve.isPending}
              rejectPending={reject.isPending}
            />
          ) : isDesktop ? (
            <div className="ed-franchise-apps-page__placeholder">
              <p className="ed-text-sm ed-muted">
                Select a franchise application to review details and take action.
              </p>
            </div>
          ) : null
        }
      />

      {addFormOpen && brandId ? (
        <div ref={addFormRef} className="ed-franchise-apps-page__add-form">
          <ManualFranchiseInquiryCard
            brandId={brandId}
            formOpen={addFormOpen}
            onFormOpenChange={setAddFormOpen}
            hideTrigger
          />
        </div>
      ) : null}

      <button
        type="button"
        className="ed-franchise-apps-page__fab"
        aria-label="Add franchise application"
        onClick={() => setAddFormOpen(true)}
      >
        +
      </button>
    </div>
  );
}
