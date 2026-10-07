import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Badge } from "@/components/ui/badge";
import { ToastFlushBridge } from "@/components/ui/toast";
import { CustomerDetailView } from "@/components/crm/customers/customer-detail-view";
import { CustomerDetailSkeleton } from "@/components/crm/customers/customer-detail-skeleton";
import { CustomerDetailActions } from "@/components/crm/customers/customer-detail-actions";
import { getCustomer, isValidUUID } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import { Customer } from "@/types/customer";

interface CustomerDetailPageProps {
  readonly params: Promise<{
    readonly customerId: string;
  }>;
}

async function CustomerDetailData({
  customerId,
}: {
  readonly customerId: string;
}) {
  let customer: Customer;
  try {
    customer = await getCustomer(customerId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const isCompany = customer.customer_type === "company";
  const isActive = customer.status === "active";

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Customers", href: "/customers" },
    { label: customer.name },
  ];

  return (
    <div className="space-y-6">
      <ToastFlushBridge />
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Page Header with Customer Name & Metadata Row */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground-dark break-words">
            {customer.name}
          </h1>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-foreground-dark">
              {isCompany ? "Company" : "Individual"}
            </span>
            <span aria-hidden="true" className="text-slate-300">•</span>
            <Badge
              variant={isActive ? "success" : "neutral"}
              dot={false}
              className="border-transparent px-2.5 py-0.5 font-medium"
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <CustomerDetailActions
          customerId={customer.id}
          customerName={customer.name}
        />
      </header>

      {/* Structured Customer Details View */}
      <CustomerDetailView customer={customer} />
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { customerId } = await params;

  if (!isValidUUID(customerId)) {
    notFound();
  }

  return (
    <Suspense key={customerId} fallback={<CustomerDetailSkeleton />}>
      <CustomerDetailData customerId={customerId} />
    </Suspense>
  );
}
