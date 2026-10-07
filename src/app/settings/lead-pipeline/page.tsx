import React from "react";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { LeadPipelineSettingsView } from "@/components/crm/pipeline/lead-pipeline-settings-view";
import { getLeadPipeline, getLeadPipelineSummary } from "@/lib/api/lead-pipeline";

const SETTINGS_PIPELINE_BREADCRUMBS: readonly BreadcrumbItem[] = [
  HOME_BREADCRUMB_ITEM,
  { label: "Settings", href: "/settings/lead-pipeline" },
  { label: "Lead Pipeline" },
];

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lead Pipeline Settings | AccDoo CRM",
  description: "Customize your lead stages and deal conversion process.",
};

export default async function LeadPipelineSettingsPage() {
  const [pipeline, summaries] = await Promise.all([
    getLeadPipeline().catch(() => null),
    getLeadPipelineSummary().catch(() => []),
  ]);

  if (!pipeline) {
    return (
      <div className="space-y-6">
        <PageBreadcrumbs items={SETTINGS_PIPELINE_BREADCRUMBS} />
        <div className="bg-white border border-border-subtle rounded-xl p-8 text-center space-y-3 max-w-xl mx-auto shadow-xs">
          <p className="text-sm font-medium text-foreground-dark">
            Unable to load Lead Pipeline configuration.
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
      <PageBreadcrumbs items={SETTINGS_PIPELINE_BREADCRUMBS} />
      <LeadPipelineSettingsView
        initialPipeline={pipeline}
        initialSummaries={summaries}
      />
    </div>
  );
}
