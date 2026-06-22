import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { listCenterAssessments, type StudentAssessmentRow } from "@/lib/centerAssessmentsApi";
import { fetchCenterOpsReport } from "@/lib/centerReportsApi";
import {
  assessmentLevelLabel,
  assessmentVelocityHint,
  enrollmentHealthHint,
  formatAssessmentScore,
  formatReportDate,
  mergeReportSummary,
  pipelineConversionPercent,
  pipelineLeadTotal,
  reportAssessmentStatus,
  reportDesktopSubtitle,
  reportMobileSubtitle,
  reportQuarterLabel,
  sortAssessmentsNewestFirst,
  studentDisplayName,
} from "@/lib/centerReportsHelpers";
import { initialsFromName } from "@/lib/welcomeMessage";
import "./centerReports.css";

const CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function avatarTone(index: number): "blue" | "purple" | "pink" {
  const tones: Array<"blue" | "purple" | "pink"> = ["blue", "purple", "pink"];
  return tones[index % tones.length]!;
}

function AssessmentRowDesktop({ row, index }: { row: StudentAssessmentRow; index: number }) {
  const status = reportAssessmentStatus(row.passed, row.score, row.max_score);
  const tone = avatarTone(index);
  return (
    <tr>
      <td>
        <div className="ed-center-reports-student">
          <span className={`ed-center-reports-student__avatar ed-center-reports-student__avatar--${tone}`}>
            {initialsFromName(studentDisplayName(row))}
          </span>
          <span>{studentDisplayName(row)}</span>
        </div>
      </td>
      <td>{assessmentLevelLabel(row)}</td>
      <td>{formatReportDate(row.assessed_at)}</td>
      <td>{formatAssessmentScore(row.score, row.max_score)}</td>
      <td>
        <span className={`ed-center-reports-status ed-center-reports-status--${status.tone}`}>{status.label}</span>
      </td>
    </tr>
  );
}

function AssessmentRowMobile({ row, index }: { row: StudentAssessmentRow; index: number }) {
  const status = reportAssessmentStatus(row.passed, row.score, row.max_score);
  const tone = avatarTone(index);
  return (
    <div className="ed-center-reports-mobile-row">
      <span className={`ed-center-reports-student__avatar ed-center-reports-student__avatar--${tone}`}>
        {initialsFromName(studentDisplayName(row))}
      </span>
      <div className="ed-center-reports-mobile-row__meta">
        <p className="ed-center-reports-mobile-row__name">{studentDisplayName(row)}</p>
        <p className="ed-center-reports-mobile-row__sub">
          {assessmentLevelLabel(row)} • {formatReportDate(row.assessed_at)}
        </p>
      </div>
      <span className={`ed-center-reports-status ed-center-reports-status--${status.tone}`}>{status.label}</span>
    </div>
  );
}

export function CenterReportsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const { data: branding } = usePortalBranding();
  const [sortDesc, setSortDesc] = useState(true);

  const report = useQuery({
    queryKey: ["center-ops-report", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterOpsReport(centerId!),
  });

  const assessments = useQuery({
    queryKey: ["center-assessments-report", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterAssessments(centerId!),
  });

  const summary = mergeReportSummary(report.data);
  const totalLeads = pipelineLeadTotal(summary.openLeads, summary.convertedLeads);
  const conversionPct = pipelineConversionPercent(summary.openLeads, summary.convertedLeads);
  const convertedShare = totalLeads > 0 ? (summary.convertedLeads / totalLeads) * 100 : 0;

  const assessmentRows = useMemo(() => {
    const rows = sortAssessmentsNewestFirst(assessments.data ?? []);
    return sortDesc ? rows : [...rows].reverse();
  }, [assessments.data, sortDesc]);

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  const loading = report.isLoading || assessments.isLoading;
  const enrollmentPct =
    summary.activeEnrollments > 0 ? Math.min(100, Math.round((summary.activeEnrollments / 10) * 100)) : 0;

  return (
    <div className="ed-center-reports">
      <header className="ed-center-reports__header">
        <div>
          <h1 className="ed-center-reports__title">Reports</h1>
          <p className="ed-center-reports__subtitle ed-center-reports__subtitle--desktop">{reportDesktopSubtitle()}</p>
          <p className="ed-center-reports__subtitle ed-center-reports__subtitle--mobile">
            {reportMobileSubtitle(branding?.centerName ?? null, centerId)}
          </p>
        </div>
        <span className="ed-center-reports__badge">{reportQuarterLabel()}</span>
      </header>

      <div className="ed-center-reports__metrics ed-center-reports__metrics--desktop">
        <article className="ed-center-reports-metric">
          <div className="ed-center-reports-metric__head">
            <span className="ed-center-reports-metric__icon ed-center-reports-metric__icon--blue" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M7 16v-5M12 16V8M17 16v-9" />
              </svg>
            </span>
            <span className="ed-center-reports-metric__meta">Last 30 Days</span>
          </div>
          <p className="ed-center-reports-metric__label">Active Pipeline</p>
          <p className="ed-center-reports-metric__value">{totalLeads} Total Leads</p>
          <div className="ed-center-reports-metric__progress" aria-hidden>
            <div className="ed-center-reports-metric__progress-fill" style={{ width: `${convertedShare}%` }} />
          </div>
          <div className="ed-center-reports-metric__progress-foot">
            <span>{summary.openLeads} Open</span>
            <span>{summary.convertedLeads} Converted</span>
          </div>
        </article>

        <article className="ed-center-reports-metric">
          <div className="ed-center-reports-metric__head">
            <span className="ed-center-reports-metric__icon ed-center-reports-metric__icon--purple" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <Link className="ed-center-reports-metric__link" to="/app/students">
              View Details
            </Link>
          </div>
          <p className="ed-center-reports-metric__label">Enrollment Health</p>
          <p className="ed-center-reports-metric__value">{summary.activeEnrollments} Active Students</p>
          <p className="ed-center-reports-metric__hint">{enrollmentHealthHint(summary.activeEnrollments)}</p>
        </article>

        <article className="ed-center-reports-metric">
          <div className="ed-center-reports-metric__head">
            <span className="ed-center-reports-metric__icon ed-center-reports-metric__icon--pink" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </span>
          </div>
          <p className="ed-center-reports-metric__label">Assessment Velocity</p>
          <p className="ed-center-reports-metric__value">{summary.assessments30d} Assessments Recorded</p>
          <p className="ed-center-reports-metric__hint">{assessmentVelocityHint(summary.assessments30d)}</p>
        </article>
      </div>

      <div className="ed-center-reports__metrics ed-center-reports__metrics--mobile">
        <article className="ed-center-reports-mobile-metric">
          <div className="ed-center-reports-mobile-metric__row">
            <div className="ed-center-reports-mobile-metric__left">
              <span className="ed-center-reports-mobile-metric__circle" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </span>
              <div>
                <p className="ed-center-reports-mobile-metric__label">Active Pipeline</p>
                <p className="ed-center-reports-mobile-metric__value">{totalLeads}</p>
              </div>
            </div>
            {summary.convertedLeads > 0 ? (
              <span className="ed-center-reports-mobile-metric__trend">↑ {summary.convertedLeads} converted</span>
            ) : null}
          </div>
        </article>

        <article className="ed-center-reports-mobile-metric ed-center-reports-mobile-metric--accent">
          <div className="ed-center-reports-mobile-metric__row">
            <div>
              <p className="ed-center-reports-mobile-metric__label">Enrollment Health</p>
              <p className="ed-center-reports-mobile-metric__value">{summary.activeEnrollments}</p>
            </div>
            <span
              className="ed-center-reports-mobile-metric__ring"
              style={{
                background: `conic-gradient(var(--ed-primary) ${enrollmentPct}%, var(--ed-border) 0)`,
              }}
            >
              {summary.activeEnrollments > 0 ? "Active" : "—"}
            </span>
          </div>
          <p className="ed-center-reports-mobile-metric__foot">{enrollmentHealthHint(summary.activeEnrollments)}</p>
        </article>

        <article className="ed-center-reports-mobile-metric">
          <div className="ed-center-reports-mobile-metric__row">
            <div>
              <p className="ed-center-reports-mobile-metric__label">Assessment Velocity</p>
              <p className="ed-center-reports-mobile-metric__value">{summary.assessments30d}</p>
            </div>
            <span className="ed-center-reports-mobile-badge">
              {summary.assessments30d >= 4 ? "High" : summary.assessments30d > 0 ? "On track" : "Low"}
            </span>
          </div>
          <div className="ed-center-reports-mobile-bars" aria-hidden>
            {[0.45, 0.55, 0.65, 1].map((scale, index) => (
              <span key={index} style={{ height: `${scale * 100}%`, opacity: summary.assessments30d > index ? 1 : 0.35 }} />
            ))}
          </div>
        </article>
      </div>

      <section className="ed-center-reports__quick-actions" aria-label="Quick actions">
        <h2 className="ed-center-reports__quick-actions-title">Quick Actions</h2>
        <div className="ed-center-reports__quick-grid">
          <button type="button" className="ed-center-reports__quick-btn ed-center-reports__quick-btn--primary" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6M12 18v-6M9 15h6" />
            </svg>
            New Report
          </button>
          <button type="button" className="ed-center-reports__quick-btn" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 4h16v16H4z" />
              <path d="m22 6-10 7L2 6" />
            </svg>
            Export PDF
          </button>
        </div>
      </section>

      <div className="ed-center-reports__workspace">
        <section className="ed-center-reports-panel">
          <div className="ed-center-reports-panel__head">
            <h2 className="ed-center-reports-panel__title">Recent Assessments</h2>
            <div className="ed-center-reports-panel__tools">
              <button type="button" className="ed-center-reports-panel__tool" disabled>
                Filter
              </button>
              <button
                type="button"
                className="ed-center-reports-panel__tool"
                onClick={() => setSortDesc((value) => !value)}
              >
                Sort {sortDesc ? "↓" : "↑"}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="ed-center-reports-empty">Loading report data…</p>
          ) : assessmentRows.length === 0 ? (
            <p className="ed-center-reports-empty">No assessments recorded yet.</p>
          ) : (
            <>
              <div className="ed-center-reports-table-wrap">
                <table className="ed-center-reports-table">
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Course/Level</th>
                      <th scope="col">Date</th>
                      <th scope="col">Score</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentRows.slice(0, 10).map((row, index) => (
                      <AssessmentRowDesktop key={row.id} row={row} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ed-center-reports-mobile-list">
                <div className="ed-center-reports-mobile-list__head">
                  <h2 className="ed-center-reports-mobile-list__title">Recent Assessments</h2>
                  <Link className="ed-center-reports-mobile-list__link" to="/app/students?tab=assessments">
                    View All
                  </Link>
                </div>
                <div className="ed-center-reports-panel">
                  {assessmentRows.slice(0, 6).map((row, index) => (
                    <AssessmentRowMobile key={row.id} row={row} index={index} />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="ed-center-reports-panel__foot">
            <Link to="/app/students?tab=assessments">Record assessments</Link>
          </div>
        </section>

        <aside className="ed-center-reports-aside">
          <section className="ed-center-reports-widget">
            <h3 className="ed-center-reports-widget__title">Pipeline Health</h3>
            <div className="ed-center-reports-donut">
              <div
                className="ed-center-reports-donut__ring"
                style={{
                  background: `conic-gradient(var(--ed-primary) ${conversionPct}%, var(--ed-border) 0)`,
                }}
              >
                <div className="ed-center-reports-donut__label">
                  <strong>{conversionPct}%</strong>
                  CONVERSION
                </div>
              </div>
            </div>
            <div className="ed-center-reports-stats">
              <div className="ed-center-reports-stats__row">
                <span>Leads Generated</span>
                <span>{totalLeads}</span>
              </div>
              <div className="ed-center-reports-stats__row">
                <span>Qualified</span>
                <span>{summary.convertedLeads}</span>
              </div>
            </div>
          </section>

          <section className="ed-center-reports-widget">
            <h3 className="ed-center-reports-widget__title">Quick Actions</h3>
            <div className="ed-center-reports-actions">
              {[
                { label: "Export CSV", icon: "↓" },
                { label: "Monthly Summary", icon: "📄" },
                { label: "Email Stakeholders", icon: "✉" },
              ].map((action) => (
                <button key={action.label} type="button" className="ed-center-reports-action" disabled>
                  <span className="ed-center-reports-action__icon" aria-hidden>
                    {action.icon}
                  </span>
                  {action.label}
                  <span className="ed-center-reports-action__chevron">{CHEVRON}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="ed-center-reports-promo">
            <h3 className="ed-center-reports-promo__title">Scale Your Center</h3>
            <p className="ed-center-reports-promo__text">Get advanced marketing insights.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
