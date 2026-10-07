import React from "react";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { DealPipelineSettingsView } from "@/components/crm/pipeline/deal-pipeline-settings-view";
import { getDealPipeline, getDealPipelineSummary } from "@/lib/api/deal-pipeline";

const SETTINGS_DEAL_PIPELINE_BREADCRUMBS: readonly BreadcrumbItem[] = [
  HOME_BREADCRUMB_ITEM,
  { label: "Settings", href: "/settings/deal-pipeline" },
  { label: "Deal Pipeline" },
];

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Deal Pipeline Settings | AccDoo CRM",
  description: "Customize the stages used to manage sales opportunities.",
};

export default async function DealPipelineSettingsPage() {
  const [pipeline, summaries] = await Promise.all([
    getDealPipeline().catch(() => null),
    getDealPipelineSummary().catch(() => []),
  ]);

  if (!pipeline) {
    return (
      <div className="space-y-6">
        <PageBreadcrumbs items={SETTINGS_DEAL_PIPELINE_BREADCRUMBS} />
        <div className="bg-white border border-border-subtle rounded-xl p-8 text-center space-y-3 max-w-xl mx-auto shadow-xs">
          <p className="text-sm font-medium text-foreground-dark">
            Unable to load Deal Pipeline configuration.
          </p>
          <p className="text-xs text-muted-foreground">
            Please make sure you are signed in and backend services are reachable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={SETTINGS_DEAL_PIPELINE_BREADCRUMBS} />
      <DealPipelineSettingsView
        initialPipeline={pipeline}
        initialSummaries={summaries}
      />
    </div>
  );
}
