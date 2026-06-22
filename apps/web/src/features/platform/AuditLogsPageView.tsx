import { useMemo, useState } from "react";
import {
  AuditActionBadge,
  AuditAdminCell,
  AuditDataTable,
  AuditDetailPanel,
  AuditDetailSection,
  AuditEntityTags,
  AuditFab,
  AuditFilterSelect,
  AuditJsonBlock,
  AuditLayoutWithDetail,
  AuditMobileGroup,
  AuditMobileItem,
  AuditMobileSearch,
  AuditOutlineButton,
  AuditPageHeader,
  AuditPagination,
  AuditPrimaryButton,
  AuditShell,
  AuditSummaryCard,
  AuditSummaryGrid,
  AuditTimestampCell,
  AuditToolbar,
  AuditVisibility,
} from "@edunudg/ui";
import {
  auditActionLabel,
  auditActionTone,
  auditActorInitials,
  auditActorName,
  auditCategory,
  auditCategoryTone,
  auditEntityTags,
  auditEventDescription,
  auditEventTitle,
  auditFilterOptions,
  auditIpAddress,
  auditRequestId,
  computeAuditSummary,
  exportAuditCsv,
  filterAuditLogs,
  formatAuditTimestamp,
  formatResourceLabel,
  groupLogsByDay,
  type AuditDateRange,
  type PlatformAuditLog,
} from "@/lib/platformAuditHelpers";
import "./auditLogsPage.css";

const PAGE_SIZE = 5;

const AUDIT_EVENT_HINTS = [
  "Brand signup approved or rejected",
  "Subscription plan created, updated, or deleted",
  "Brand subscription assigned, updated, or removed",
];

const ICON_FILTER = <span aria-hidden>⏷</span>;
const ICON_USER = <span aria-hidden>👤</span>;
const ICON_CAL = <span aria-hidden>📅</span>;
const ICON_DOWNLOAD = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);

function categoryIcon(category: string) {
  if (category === "LOGIN") return "⤴";
  if (category === "REVENUE") return "₹";
  if (category === "SECURITY") return "⛨";
  if (category === "BRANDS") return "⌂";
  if (category === "SUBSCRIPTION") return "▶";
  return "•";
}

function DetailContent({ log }: { log: PlatformAuditLog }) {
  return (
    <>
      <AuditDetailSection title="Description">
        <p>{auditEventDescription(log)}</p>
      </AuditDetailSection>
      <AuditDetailSection title="Changed Data (JSON)">
        <AuditJsonBlock>{JSON.stringify(log.payload ?? {}, null, 2)}</AuditJsonBlock>
      </AuditDetailSection>
      <AuditDetailSection title="Associated Entities">
        <AuditEntityTags tags={auditEntityTags(log)} />
      </AuditDetailSection>
    </>
  );
}

export function AuditLogsPageView({
  logs,
  loading,
}: {
  logs: PlatformAuditLog[];
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [dateRange, setDateRange] = useState<AuditDateRange>("24h");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const summary = useMemo(() => computeAuditSummary(logs), [logs]);
  const { actionOptions, adminOptions } = useMemo(() => auditFilterOptions(logs), [logs]);

  const filtered = useMemo(
    () => filterAuditLogs(logs, { search, actionFilter, adminFilter, dateRange }),
    [logs, search, actionFilter, adminFilter, dateRange]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const selected = filtered.find((log) => log.id === selectedId) ?? pageItems[0] ?? null;

  const mobileGroups = useMemo(() => groupLogsByDay(filtered.slice(0, 20)), [filtered]);

  const tableRows = pageItems.map((log) => {
    const ts = formatAuditTimestamp(log.created_at);
    const tone = auditCategoryTone(log.action, log.resource_type);
    return {
      key: log.id,
      cells: {
        timestamp: <AuditTimestampCell date={ts.date} time={ts.time} />,
        admin: (
          <AuditAdminCell initials={auditActorInitials(log)} name={auditActorName(log)} tone={tone} />
        ),
        action: (
          <AuditActionBadge
            label={auditActionLabel(log.action, log.resource_type)}
            tone={auditActionTone(log.action, log.resource_type)}
          />
        ),
        resource: formatResourceLabel(log),
        ip: auditIpAddress(log),
      },
    };
  });

  const emptyState = (
    <div className="ed-audit-empty">
      <p>No audit events yet.</p>
      <p>Events appear when platform admins perform actions such as:</p>
      <ul>
        {AUDIT_EVENT_HINTS.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <AuditShell>
      <AuditVisibility
        mobile={
          <>
            <AuditPageHeader
              title="Audit Logs"
              subtitle="Track system-wide administrative actions and security events."
            />
            <AuditMobileSearch
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              onFilterClick={() => setMobileFiltersOpen((open) => !open)}
            />
            {mobileFiltersOpen ? (
              <div className="ed-audit-page__mobile-filters">
                <AuditFilterSelect
                  label="Action"
                  value={actionFilter}
                  onChange={setActionFilter}
                  options={actionOptions}
                  icon={ICON_FILTER}
                />
                <AuditFilterSelect
                  label="Date"
                  value={dateRange}
                  onChange={(value) => setDateRange(value as AuditDateRange)}
                  options={[
                    { value: "24h", label: "Last 24 Hours" },
                    { value: "7d", label: "Last 7 Days" },
                    { value: "all", label: "All time" },
                  ]}
                  icon={ICON_CAL}
                />
              </div>
            ) : null}
            {loading ? (
              <p className="ed-audit-empty">Loading audit events…</p>
            ) : filtered.length === 0 ? (
              emptyState
            ) : (
              mobileGroups.map((group) => (
                <AuditMobileGroup key={group.label} label={group.label}>
                  {group.items.map((log) => {
                    const category = auditCategory(log.action, log.resource_type);
                    const tone = auditCategoryTone(log.action, log.resource_type);
                    const ts = formatAuditTimestamp(log.created_at);
                    return (
                      <AuditMobileItem
                        key={log.id}
                        icon={categoryIcon(category)}
                        iconTone={tone}
                        category={category}
                        time={ts.mobileTime}
                        title={auditEventTitle(log)}
                        meta={
                          <>
                            Admin: {auditActorName(log)}
                            <br />
                            {formatResourceLabel(log)} · IP: {auditIpAddress(log)}
                          </>
                        }
                        onClick={() => setSelectedId(log.id)}
                      />
                    );
                  })}
                </AuditMobileGroup>
              ))
            )}
            <AuditFab label="Export audit logs" onClick={() => exportAuditCsv(filtered)}>
              {ICON_DOWNLOAD}
            </AuditFab>
            <AuditDetailPanel
              open={selectedId != null && selected != null}
              title="Entry Metadata"
              subtitle={selected ? `Request ID: ${auditRequestId(selected)}` : undefined}
              onClose={() => setSelectedId(null)}
              footer={<AuditOutlineButton>Full Audit Trail</AuditOutlineButton>}
            >
              {selected ? <DetailContent log={selected} /> : null}
            </AuditDetailPanel>
          </>
        }
        desktop={
          <>
            <AuditPageHeader
              title="Audit Logs"
              subtitle="Track system-wide administrative actions and security events."
            />

            <AuditSummaryGrid>
              <AuditSummaryCard
                label="Total Events (24h)"
                value={summary.events24h.toLocaleString("en-IN")}
                trend={summary.eventsTrend}
                trendTone="up"
              />
              <AuditSummaryCard
                label="Security Alerts"
                value={summary.securityAlerts}
                hint="Last 7 days"
                trendTone="down"
              />
              <AuditSummaryCard
                label="Active Admins"
                value={summary.activeAdmins}
                hint={summary.adminHint}
              />
              <AuditSummaryCard label="System Health" value={summary.systemHealth} statusDot />
            </AuditSummaryGrid>

            <AuditToolbar
              filters={
                <>
                  <AuditFilterSelect
                    label="Action Type"
                    value={actionFilter}
                    onChange={(value) => {
                      setActionFilter(value);
                      setPage(0);
                    }}
                    options={actionOptions}
                    icon={ICON_FILTER}
                  />
                  <AuditFilterSelect
                    label="Admin"
                    value={adminFilter}
                    onChange={(value) => {
                      setAdminFilter(value);
                      setPage(0);
                    }}
                    options={adminOptions}
                    icon={ICON_USER}
                  />
                  <AuditFilterSelect
                    label="Date"
                    value={dateRange}
                    onChange={(value) => {
                      setDateRange(value as AuditDateRange);
                      setPage(0);
                    }}
                    options={[
                      { value: "24h", label: "Last 24 Hours" },
                      { value: "7d", label: "Last 7 Days" },
                      { value: "all", label: "All time" },
                    ]}
                    icon={ICON_CAL}
                  />
                </>
              }
              actions={
                <AuditPrimaryButton icon={ICON_DOWNLOAD} onClick={() => exportAuditCsv(filtered)}>
                  Export CSV
                </AuditPrimaryButton>
              }
            />

            <AuditLayoutWithDetail
              main={
                <section className="ed-audit-panel">
                  {loading ? (
                    <p className="ed-audit-empty">Loading audit events…</p>
                  ) : filtered.length === 0 ? (
                    emptyState
                  ) : (
                    <>
                      <AuditDataTable
                        columns={[
                          { key: "timestamp", label: "Timestamp" },
                          { key: "admin", label: "Admin User" },
                          { key: "action", label: "Action" },
                          { key: "resource", label: "Resource" },
                          { key: "ip", label: "IP Address" },
                        ]}
                        rows={tableRows}
                        selectedKey={selected?.id ?? null}
                        onSelect={setSelectedId}
                      />
                      <AuditPagination
                        summary={`Showing ${filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length.toLocaleString("en-IN")} entries`}
                        onPrevious={() => setPage((p) => Math.max(0, p - 1))}
                        onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                        disablePrevious={currentPage === 0}
                        disableNext={currentPage >= pageCount - 1}
                      />
                    </>
                  )}
                </section>
              }
              detail={
                <AuditDetailPanel
                  open={selected != null}
                  title="Entry Metadata"
                  subtitle={selected ? `Request ID: ${auditRequestId(selected)}` : undefined}
                  onClose={() => setSelectedId(null)}
                  footer={<AuditOutlineButton>Full Audit Trail</AuditOutlineButton>}
                >
                  {selected ? <DetailContent log={selected} /> : null}
                </AuditDetailPanel>
              }
            />
          </>
        }
      />
    </AuditShell>
  );
}
