import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Button } from "@/components/ui/button";
import { DealListView } from "@/components/crm/deals/deal-list-view";
import { DealListSkeleton } from "@/components/crm/deals/deal-list-skeleton";
import { loadDealsPageData } from "@/lib/api/deals";
import { getDealPipeline } from "@/lib/api/deal-pipeline";

const DEALS_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Deals" },
] as const;

interface DealsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface DealsTableDataProps {
  readonly resolvedParams: { [key: string]: string | string[] | undefined };
}

async function DealsTableData({ resolvedParams }: DealsTableDataProps) {
  const [pageData, pipeline] = await Promise.all([
    loadDealsPageData(resolvedParams, "/deals"),
    getDealPipeline().catch((err) => {
      console.error("Failed to fetch deal pipeline:", err);
      return null;
    }),
  ]);

  const {
    data,
    sanitizedSearch,
    sanitizedCustomerId,
    sanitizedContactId,
    sanitizedStageId,
    sanitizedStage,
    initialCustomerOption,
    initialContactOption,
    redirectUrl,
  } = pageData;

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <DealListView
      initialDeals={data.items}
      meta={{
        total: data.meta.total,
        page: data.meta.page,
        pageSize: data.meta.pageSize,
        totalPages: data.meta.totalPages,
      }}
      currentSearch={sanitizedSearch}
      currentCustomerId={sanitizedCustomerId}
      currentContactId={sanitizedContactId}
      currentStageId={sanitizedStageId}
      currentStage={sanitizedStage}
      initialCustomerOption={initialCustomerOption}
      initialContactOption={initialContactOption}
      pipeline={pipeline ?? undefined}
    />
  );
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={DEALS_BREADCRUMBS} />
      <PageHeader
        title="Deals"
        description="View and manage sales deals and commercial opportunities."
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

      <Suspense key={suspenseKey} fallback={<DealListSkeleton />}>
        <DealsTableData resolvedParams={params} />
      </Suspense>
    </div>
  );
}
