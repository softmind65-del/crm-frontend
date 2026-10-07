import React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  HOME_BREADCRUMB_ITEM,
  BreadcrumbItem,
} from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { CustomerForm } from "@/components/crm/customers/customer-form";
import { getCustomer, isValidUUID } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import { Customer } from "@/types/customer";

interface CustomerEditPageProps {
  readonly params: Promise<{
    readonly customerId: string;
  }>;
}

export default async function CustomerEditPage({
  params,
}: CustomerEditPageProps) {
  const { customerId } = await params;

  if (!isValidUUID(customerId)) {
    notFound();
  }

  let customer: Customer;
  try {
    customer = await getCustomer(customerId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Customers", href: "/customers" },
    { label: customer.name, href: `/customers/${customerId}` },
    { label: "Edit" },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={breadcrumbs} />
      <PageHeader
        title="Edit Customer"
        description="Update customer information and contact details."
      />

      <CustomerForm
        mode="edit"
        customerId={customerId}
        initialValues={customer}
      />
    </div>
  );
}
