import React from "react";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { LeadForm } from "@/components/crm/leads/lead-form";
import { getLead } from "@/lib/api/leads";
import { getCustomer } from "@/lib/api/customers";
import { getContact } from "@/lib/api/contacts";
import { isValidUUID } from "@/lib/utils/uuid";
import { BackendApiError } from "@/types/api";
import { Lead } from "@/types/lead";
import { ContactPickerOption } from "@/components/forms/contact-picker";
import { getLeadPipeline } from "@/lib/api/lead-pipeline";

interface EditLeadPageProps {
  params: Promise<{ leadId: string }>;
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { leadId } = await params;

  if (!isValidUUID(leadId)) {
    notFound();
  }

  let lead: Lead;
  try {
    lead = await getLead(leadId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Converted leads are finalized and cannot be edited
  if (lead.status === "converted") {
    redirect(`/leads/${leadId}`);
  }

  // Resolve customer name, contact option, and pipeline stages server-side
  const [customerResult, contactResult, pipelineResult] = await Promise.all([
    getCustomer(lead.customer_id).catch(() => null),
    lead.contact_id ? getContact(lead.contact_id).catch(() => null) : Promise.resolve(null),
    getLeadPipeline().catch(() => null),
  ]);

  const customerName = customerResult?.name ?? "Customer unavailable";
  const initialContactOption: ContactPickerOption | null = contactResult
    ? {
        value: contactResult.id,
        label: contactResult.name,
        sublabel: contactResult.job_title ?? null,
        customerId: contactResult.customer_id,
      }
    : null;

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Leads", href: "/leads" },
    { label: lead.title, href: `/leads/${lead.id}` },
    { label: "Edit" },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={breadcrumbs} />
      <PageHeader
        title={`Edit ${lead.title}`}
        description="Update opportunity details and contact information."
      />

      <LeadForm
        mode="edit"
        leadId={leadId}
        initialLead={lead}
        customerName={customerName}
        initialContactOption={initialContactOption}
        stages={pipelineResult?.stages}
      />
    </div>
  );
}
