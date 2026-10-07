import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Button } from "@/components/ui/button";
import { CustomerListView } from "@/components/crm/customers/customer-list-view";
import { CustomerListSkeleton } from "@/components/crm/customers/customer-list-skeleton";
import { getCustomers } from "@/lib/api/customers";
import { CustomerStatus, CustomerType } from "@/types/customer";

const CUSTOMERS_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Customers" },
] as const;

const ALLOWED_PAGE_SIZES = [10, 20, 50] as const;

interface CustomersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface CustomersTableDataProps {
  readonly resolvedParams: { [key: string]: string | string[] | undefined };
}

async function CustomersTableData({ resolvedParams }: CustomersTableDataProps) {
  const rawSearch = typeof resolvedParams.search === "string" ? resolvedParams.search.trim() : undefined;
  const sanitizedSearch = rawSearch ? rawSearch : undefined;

  const rawStatus = typeof resolvedParams.status === "string" ? resolvedParams.status.trim() : undefined;
  const sanitizedStatus: CustomerStatus | undefined =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : undefined;

  const rawType = typeof resolvedParams.customer_type === "string" ? resolvedParams.customer_type.trim() : undefined;
  const sanitizedCustomerType: CustomerType | undefined =
    rawType === "individual" || rawType === "company" ? rawType : undefined;

  const rawPage = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const sanitizedPage = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawPageSize = typeof resolvedParams.page_size === "string" ? parseInt(resolvedParams.page_size, 10) : 10;
  const sanitizedPageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(rawPageSize)
    ? rawPageSize
    : 10;

  const data = await getCustomers({
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    search: sanitizedSearch,
    status: sanitizedStatus,
    customerType: sanitizedCustomerType,
  });

  if (data.meta.total > 0 && sanitizedPage > data.meta.totalPages) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedStatus) redirectQuery.set("status", sanitizedStatus);
    if (sanitizedCustomerType) redirectQuery.set("customer_type", sanitizedCustomerType);
    redirectQuery.set("page", String(data.meta.totalPages));
    if (sanitizedPageSize !== 10) redirectQuery.set("page_size", String(sanitizedPageSize));

    redirect(`/customers?${redirectQuery.toString()}`);
  }

  if (data.meta.total === 0 && sanitizedPage > 1) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedStatus) redirectQuery.set("status", sanitizedStatus);
    if (sanitizedCustomerType) redirectQuery.set("customer_type", sanitizedCustomerType);
    if (sanitizedPageSize !== 10) redirectQuery.set("page_size", String(sanitizedPageSize));

    redirect(redirectQuery.toString() ? `/customers?${redirectQuery.toString()}` : "/customers");
  }

  return (
    <CustomerListView
      initialCustomers={data.items}
      meta={data.meta}
      currentSearch={sanitizedSearch}
      currentStatus={sanitizedStatus}
      currentCustomerType={sanitizedCustomerType}
    />
  );
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={CUSTOMERS_BREADCRUMBS} />
      <PageHeader
        title="Customers"
        description="Manage and organize your customer relationships."
        action={
          <Link href="/customers/new">
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
              Add Customer
            </Button>
          </Link>
        }
      />

      <Suspense key={suspenseKey} fallback={<CustomerListSkeleton />}>
        <CustomersTableData resolvedParams={params} />
      </Suspense>
    </div>
  );
}
