import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FilterTabs,
  Input,
  MutationError,
  PageToolbar,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelineMasterDetail,
} from "@edunudg/ui";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useBrandScope } from "./hooks/useBrandScope";
import { CenterDetailPanel } from "./centers/CenterDetailPanel";
import {
  centerMatchesSearch,
  fetchBrandCenters,
  type BrandCenterRow,
} from "@/lib/centerCentersApi";
import { initialsFromName } from "@/lib/welcomeMessage";
import "@/features/center/centerOps.css";

type CenterFilter = "active" | "suspended" | "all";

const FILTER_OPTIONS: { value: CenterFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "all", label: "All" },
];

function centerListTitle(c: BrandCenterRow) {
  return c.display_name ?? c.name;
}

export function CentersPage() {
  const { brandId, brandSlug, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<CenterFilter>("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const centers = useQuery({
    queryKey: ["centers", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandCenters(brandId!),
  });

  const all = centers.data ?? [];

  useEffect(() => {
    const slug = searchParams.get("center")?.trim();
    if (!slug || all.length === 0) return;
    const match = all.find((c) => c.slug === slug);
    if (match) setSelectedId(match.id);
  }, [searchParams, all]);

  const selected = all.find((c) => c.id === selectedId) ?? null;

  const counts = useMemo(
    () => ({
      active: all.filter((c) => c.status === "active").length,
      suspended: all.filter((c) => c.status === "suspended").length,
      all: all.length,
    }),
    [all]
  );

  const filtered = useMemo(() => {
    return all.filter((c) => {
      if (filter === "active" && c.status !== "active") return false;
      if (filter === "suspended" && c.status !== "suspended") return false;
      return centerMatchesSearch(c, search);
    });
  }, [all, filter, search]);

  const filterTabs = FILTER_OPTIONS.map((option) => ({
    ...option,
    count: counts[option.value],
  }));

  const selectCenter = (id: string) => {
    setSelectedId(id);
    const center = all.find((c) => c.id === id);
    if (center) {
      setSearchParams({ center: center.slug }, { replace: true });
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setSearchParams({}, { replace: true });
  };

  const refreshCenters = () => {
    void qc.invalidateQueries({ queryKey: ["centers", brandId] });
  };

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found. Check domain mapping for this hostname.</p>;
  }

  return (
    <>
      <PageToolbar
        title="Franchise Centers"
        subtitle="Manage franchise profile, curriculum, and lifecycle from one workspace."
      >
        <Input
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder="Name or phone…"
          name="search"
        />
      </PageToolbar>

      <AddFormSection buttonLabel="Add center" panelTitle="Add a new center">
        <>
          <p className="ed-text-sm ed-muted">
            New centers are provisioned when you approve a franchise application — that creates the center record and{" "}
            <code>{`{center}.{brand}`}</code> domain mapping in one step.
          </p>
          <Link to="/app/franchise-applications">
            <Button>Go to franchise applications</Button>
          </Link>
        </>
      </AddFormSection>

      <PipelineMasterDetail
        list={
          <Card title="Franchises">
            <FilterTabs options={filterTabs} value={filter} onChange={setFilter} aria-label="Franchise status filter" />
            <div className="ed-ops-stagger">
            <DataList
              variant="pipeline"
              items={filtered}
              empty={
                <PipelineEmptyState
                  message={search.trim() ? "No franchises match your search." : "No franchises in this view."}
                  actionLabel={filter !== "all" ? "Show all" : undefined}
                  onAction={filter !== "all" ? () => setFilter("all") : undefined}
                />
              }
              render={(c) => {
                const title = centerListTitle(c);
                const isSelected = c.id === selectedId;
                return (
                  <PipelineListItem
                    title={title}
                    meta={[c.city, c.contact_phone].filter(Boolean).join(" · ") || c.slug}
                    initials={initialsFromName(title)}
                    selected={isSelected}
                    onSelect={() => selectCenter(c.id)}
                    badges={
                      <Badge
                        tone={
                          c.status === "active" ? "success" : c.status === "suspended" ? "warning" : "default"
                        }
                      >
                        {c.status}
                      </Badge>
                    }
                  />
                );
              }}
            />
            </div>
          </Card>
        }
        detail={
          selected && brandId && brandSlug ? (
            <CenterDetailPanel
              center={selected}
              brandId={brandId}
              brandSlug={brandSlug}
              onClose={closeDetail}
              onStatusChanged={refreshCenters}
            />
          ) : (
            <PipelineDetailPlaceholder message="Select a franchise to view and edit details, assign curriculum, or suspend access." />
          )
        }
      />
    </>
  );
}
