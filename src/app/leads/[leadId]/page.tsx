import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Badge } from "@/components/ui/badge";
import { ToastFlushBridge } from "@/components/ui/toast";
import { LeadDetailView } from "@/components/crm/leads/lead-detail-view";
import { LeadDetailSkeleton } from "@/components/crm/leads/lead-detail-skeleton";
import { LeadDetailActions } from "@/components/crm/leads/lead-detail-actions";
import { getLead } from "@/lib/api/leads";
import { getCustomer } from "@/lib/api/customers";
import { getContact } from "@/lib/api/contacts";
import { getLeadPipeline } from "@/lib/api/lead-pipeline";
import { getStageBadgeClasses } from "@/lib/utils/stage-colors";
import { isValidUUID } from "@/lib/utils/uuid";
import { formatLeadStatus, getLeadStatusBadgeVariant } from "@/lib/utils/lead-format";
import { BackendApiError } from "@/types/api";
import { Lead, LeadListItem } from "@/types/lead";

interface LeadDetailPageProps {
  readonly params: Promise<{
    readonly leadId: string;
  }>;
}

async function LeadDetailData({ leadId }: { readonly leadId: string }) {
  let lead: Lead;
  try {
    lead = await getLead(leadId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Resolve Customer, Contact, and Pipeline server-side in parallel
  const [customerResult, contactResult, pipelineResult] = await Promise.all([
    getCustomer(lead.customer_id).catch(() => null),
    lead.contact_id ? getContact(lead.contact_id).catch(() => null) : Promise.resolve(null),
    getLeadPipeline().catch(() => null),
  ]);

  const customerName = customerResult?.name ?? "Customer unavailable";
  const contactName = lead.contact_id
    ? contactResult?.name ?? "Contact unavailable"
    : null;

  const leadWithResolvedNames: LeadListItem = {
    ...lead,
    customer_name: customerName,
    contact_name: contactName,
  };

  const currentStage = pipelineResult?.stages?.find(
    (s) => s.id === lead.pipeline_stage_id
  );
  const isConversionStage = currentStage
    ? Boolean(currentStage.is_conversion_stage)
    : lead.status === "qualified";

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Leads", href: "/leads" },
    { label: lead.title },
  ];

  return (
    <div className="space-y-6">
      <ToastFlushBridge />
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Page Header with Lead Title & Metadata */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground-dark break-words">
            {lead.title}
          </h1>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
            {currentStage ? (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStageBadgeClasses(
                  currentStage.color_key
                )}`}
              >
                {currentStage.name}
              </span>
            ) : (
              <Badge
                variant={getLeadStatusBadgeVariant(lead.status)}
                dot={false}
                className="border-transparent px-2.5 py-0.5 font-medium"
              >
                {formatLeadStatus(lead.status)}
              </Badge>
            )}
            <span aria-hidden="true" className="text-slate-300">
              •
            </span>
            <span className="font-medium text-foreground-dark">
              {customerName}
            </span>
          </div>
        </div>
        <LeadDetailActions
          lead={leadWithResolvedNames}
          isConversionStage={isConversionStage}
        />
      </header>

      <LeadDetailView lead={leadWithResolvedNames} stage={currentStage} />
    </div>
  );
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { leadId } = await params;

  if (!isValidUUID(leadId)) {
    notFound();
  }

  return (
    <Suspense key={leadId} fallback={<LeadDetailSkeleton />}>
      <LeadDetailData leadId={leadId} />
    </Suspense>
  );
}
