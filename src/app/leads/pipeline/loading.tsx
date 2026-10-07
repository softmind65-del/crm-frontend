import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { LeadPipelineSkeleton } from "@/components/crm/leads/lead-pipeline-skeleton";

const PIPELINE_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Leads", href: "/leads" },
  { label: "Pipeline" },
] as const;

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={PIPELINE_BREADCRUMBS} />
      <PageHeader
        title="Leads Pipeline"
        description="Track lead progress across qualification stages."
      />
      <LeadPipelineSkeleton showToolbar={true} />
    </div>
  );
}
