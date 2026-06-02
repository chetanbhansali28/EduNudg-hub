import { KpiCard, KpiGrid, PageTitle } from "@edunudg/ui";

export function CenterDashboard() {
  return (
    <>
      <PageTitle>Operations Dashboard</PageTitle>
      <KpiGrid>
        <KpiCard label="Today's batches" value="—" />
        <KpiCard label="Attendance (7d)" value="—" />
        <KpiCard label="Open leads" value="—" />
        <KpiCard label="Fee collection" value="—" />
      </KpiGrid>
    </>
  );
}
