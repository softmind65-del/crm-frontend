import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Button } from "@/components/ui/button";
import { LeadListView } from "@/components/crm/leads/lead-list-view";
import { LeadPipelineSkeleton } from "@/components/crm/leads/lead-pipeline-skeleton";
import { loadLeadsPageData } from "@/lib/api/leads";

import { getLeadPipeline, getLeadPipelineSummary } from "@/lib/api/lead-pipeline";

const PIPELINE_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Leads", href: "/leads" },
  { label: "Pipeline" },
] as const;

interface LeadsPipelinePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface LeadsPipelineDataProps {
  readonly resolvedParams: { [key: string]: string | string[] | undefined };
}

async function LeadsPipelineData({ resolvedParams }: LeadsPipelineDataProps) {
  const [pageData, pipeline, summary] = await Promise.all([
    loadLeadsPageData(resolvedParams, "/leads/pipeline"),
    getLeadPipeline().catch((err) => {
      console.error("Failed to fetch lead pipeline:", err);
      return null;
    }),
    getLeadPipelineSummary().catch((err) => {
      console.error("Failed to fetch lead pipeline summary:", err);
      return null;
    }),
  ]);

  const {
    data,
    sanitizedSearch,
    sanitizedCustomerId,
    sanitizedContactId,
    sanitizedStatus,
    sanitizedSource,
    initialCustomerOption,
    initialContactOption,
    redirectUrl,
  } = pageData;

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <LeadListView
      initialLeads={data.items}
      meta={{
        total: data.meta.total,
        page: data.meta.page,
        pageSize: data.meta.page_size,
        totalPages: data.meta.total_pages,
      }}
      currentSearch={sanitizedSearch}
      currentCustomerId={sanitizedCustomerId}
      currentContactId={sanitizedContactId}
      currentStatus={sanitizedStatus}
      currentSource={sanitizedSource}
      initialCustomerOption={initialCustomerOption}
      initialContactOption={initialContactOption}
      defaultView="pipeline"
      allowViewSwitch={false}
      pipeline={pipeline ?? undefined}
      stageSummaries={summary ?? undefined}
    />
  );
}

export default async function LeadsPipelinePage({
  searchParams,
}: LeadsPipelinePageProps) {
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={PIPELINE_BREADCRUMBS} />
      <PageHeader
        title="Leads Pipeline"
        description="Track lead progress across qualification stages."
        action={
          <Link href="/leads/new">
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
              Add Lead
            </Button>
          </Link>
        }
      />

      <Suspense
        key={suspenseKey}
        fallback={<LeadPipelineSkeleton showToolbar={true} />}
      >
        <LeadsPipelineData resolvedParams={params} />
      </Suspense>
    </div>
  );
}
