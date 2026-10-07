import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Button } from "@/components/ui/button";
import { DealPipelineView } from "@/components/crm/deals/deal-pipeline-view";
import { DealPipelineSkeleton } from "@/components/crm/deals/deal-pipeline-skeleton";
import { getDealPipeline, getDealPipelineSummary } from "@/lib/api/deal-pipeline";
import { getDeals } from "@/lib/api/deals";

const PIPELINE_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Deals", href: "/deals" },
  { label: "Pipeline" },
] as const;

async function DealPipelineServerLoader() {
  const [pipeline, summaries] = await Promise.all([
    getDealPipeline().catch(() => null),
    getDealPipelineSummary().catch(() => []),
  ]);

  if (!pipeline) {
    return (
      <div className="bg-white border border-border-subtle rounded-xl p-8 text-center space-y-3 max-w-xl mx-auto shadow-xs">
        <p className="text-sm font-medium text-foreground-dark">
          Unable to load Deal Pipeline configuration.
        </p>
        <p className="text-xs text-muted-foreground">
          Please make sure you are signed in and backend services are reachable.
        </p>
      </div>
    );
  }

  // Pre-load active deals per stage
  const dealsByStageEntries = await Promise.all(
    pipeline.stages.map(async (stage) => {
      try {
        const result = await getDeals({ stageId: stage.id, page: 1, pageSize: 20 });
        return [stage.id, result.items] as const;
      } catch {
        return [stage.id, []] as const;
      }
    })
  );

  const initialDealsByStage = Object.fromEntries(dealsByStageEntries);

  return (
    <DealPipelineView
      initialPipeline={pipeline}
      initialSummaries={summaries}
      initialDealsByStage={initialDealsByStage}
    />
  );
}

export default function DealsPipelinePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={PIPELINE_BREADCRUMBS} />
      <PageHeader
        title="Deals Pipeline"
        description="Track active opportunities through your sales process."
        action={
          <Link href="/deals/new">
            <Button
              variant="primary"
              leftIcon={
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              Add Deal
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<DealPipelineSkeleton />}>
        <DealPipelineServerLoader />
      </Suspense>
    </div>
  );
}
