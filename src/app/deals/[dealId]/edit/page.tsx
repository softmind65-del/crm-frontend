import React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { DealForm } from "@/components/crm/deals/deal-form";
import { getDeal } from "@/lib/api/deals";
import { getCustomer } from "@/lib/api/customers";
import { getContact } from "@/lib/api/contacts";
import { isValidUUID } from "@/lib/utils/uuid";
import { BackendApiError } from "@/types/api";
import { Deal } from "@/types/deal";
import { ContactPickerOption } from "@/components/forms/contact-picker";
import { CustomerPickerOption } from "@/components/forms/customer-picker";

interface EditDealPageProps {
  params: Promise<{ dealId: string }>;
}

export default async function EditDealPage({ params }: EditDealPageProps) {
  const { dealId } = await params;

  if (!isValidUUID(dealId)) {
    notFound();
  }

  let deal: Deal;
  try {
    deal = await getDeal(dealId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Pre-resolve customer and contact options server-side to guarantee readable labels
  const [customerResult, contactResult] = await Promise.all([
    getCustomer(deal.customer_id).catch(() => null),
    deal.contact_id ? getContact(deal.contact_id).catch(() => null) : Promise.resolve(null),
  ]);

  const customerName = customerResult?.name ?? (deal.customer_name || "Customer unavailable");
  const initialCustomerOption: CustomerPickerOption | null = customerResult
    ? {
        value: customerResult.id,
        label: customerResult.name,
        sublabel: customerResult.company_name ?? null,
      }
    : {
        value: deal.customer_id,
        label: customerName,
        sublabel: null,
      };

  const initialContactOption: ContactPickerOption | null = contactResult
    ? {
        value: contactResult.id,
        label: contactResult.name,
        sublabel: contactResult.job_title ?? null,
        customerId: contactResult.customer_id,
      }
    : deal.contact_id
    ? {
        value: deal.contact_id,
        label: deal.contact_name ?? "Contact unavailable",
        sublabel: null,
        customerId: deal.customer_id,
      }
    : null;

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Deals", href: "/deals" },
    { label: deal.title, href: `/deals/${deal.id}` },
    { label: "Edit" },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={breadcrumbs} />
      <PageHeader
        title={`Edit ${deal.title}`}
        description="Update opportunity details and contact information."
      />

      <DealForm
        mode="edit"
        dealId={dealId}
        initialDeal={deal}
        initialCustomerOption={initialCustomerOption}
        initialContactOption={initialContactOption}
      />
    </div>
  );
}
