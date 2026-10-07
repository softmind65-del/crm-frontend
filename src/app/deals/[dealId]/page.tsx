import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Badge } from "@/components/ui/badge";
import { ToastFlushBridge } from "@/components/ui/toast";
import { DealDetailView } from "@/components/crm/deals/deal-detail-view";
import { DealDetailSkeleton } from "@/components/crm/deals/deal-detail-skeleton";
import { DealDetailActions } from "@/components/crm/deals/deal-detail-actions";
import { getDeal } from "@/lib/api/deals";
import { getCustomer } from "@/lib/api/customers";
import { getContact } from "@/lib/api/contacts";
import { getDealPipeline } from "@/lib/api/deal-pipeline";
import { resolveStageColor } from "@/lib/utils/stage-colors";
import { isValidUUID } from "@/lib/utils/uuid";
import { DEAL_STAGE_LABELS, Deal } from "@/types/deal";
import { BackendApiError } from "@/types/api";

interface DealDetailPageProps {
  readonly params: Promise<{
    readonly dealId: string;
  }>;
}

async function DealDetailData({ dealId }: { readonly dealId: string }) {
  let deal: Deal;
  try {
    deal = await getDeal(dealId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Pre-resolve Customer, Contact, and Pipeline server-side in parallel
  const [customerResult, contactResult, pipelineResult] = await Promise.all([
    getCustomer(deal.customer_id).catch(() => null),
    deal.contact_id ? getContact(deal.contact_id).catch(() => null) : Promise.resolve(null),
    getDealPipeline().catch(() => null),
  ]);

  const customerName =
    customerResult?.name ?? (deal.customer_name || "Customer unavailable");
  const contactName = deal.contact_id
    ? contactResult?.name ?? (deal.contact_name || "Contact unavailable")
    : null;

  const dealWithResolvedNames: Deal = {
    ...deal,
    customer_name: customerName,
    contact_name: contactName,
  };

  const matchedStage =
    pipelineResult?.stages?.find((s) => s.id === deal.pipeline_stage_id) ??
    pipelineResult?.stages?.find((s) => s.legacy_stage_key === deal.stage);

  const stageStyle = matchedStage
    ? resolveStageColor(matchedStage.color_key, matchedStage.custom_color_hex)
    : resolveStageColor("blue");

  const stageLabel = matchedStage
    ? matchedStage.name
    : DEAL_STAGE_LABELS[deal.stage] ?? deal.stage;

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Deals", href: "/deals" },
    { label: deal.title },
  ];

  return (
    <div className="space-y-6">
      <ToastFlushBridge />
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Page Header with Deal Title & Metadata */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground-dark break-words">
            {deal.title}
          </h1>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Badge
              variant={stageStyle.badgeVariant}
              dot={false}
              className={`border px-2.5 py-0.5 text-xs font-semibold ${stageStyle.badgeClass}`}
              style={stageStyle.isCustom ? stageStyle.badgeStyle : undefined}
            >
              {stageLabel}
            </Badge>
            <span aria-hidden="true" className="text-slate-300">
              •
            </span>
            <span className="font-medium text-foreground-dark">
              {customerName}
            </span>
          </div>
        </div>
        <DealDetailActions deal={dealWithResolvedNames} />
      </header>

      <DealDetailView deal={dealWithResolvedNames} stage={matchedStage} />
    </div>
  );
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { dealId } = await params;

  if (!isValidUUID(dealId)) {
    notFound();
  }

  return (
    <Suspense fallback={<DealDetailSkeleton />}>
      <DealDetailData dealId={dealId} />
    </Suspense>
  );
}
