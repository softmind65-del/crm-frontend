import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Button } from "@/components/ui/button";
import { ContactListView } from "@/components/crm/contacts/contact-list-view";
import { ContactListSkeleton } from "@/components/crm/contacts/contact-list-skeleton";
import { getContacts } from "@/lib/api/contacts";
import { getCustomer, isValidUUID } from "@/lib/api/customers";
import { ContactStatus } from "@/types/contact";
import { CustomerPickerOption } from "@/components/forms/customer-picker";

const CONTACTS_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Contacts" },
] as const;

const ALLOWED_PAGE_SIZES = [10, 20, 50] as const;

interface ContactsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface ContactsTableDataProps {
  readonly resolvedParams: { [key: string]: string | string[] | undefined };
}

async function ContactsTableData({ resolvedParams }: ContactsTableDataProps) {
  const rawSearch =
    typeof resolvedParams.search === "string"
      ? resolvedParams.search.trim()
      : undefined;
  const sanitizedSearch = rawSearch ? rawSearch : undefined;

  const rawCustomerId =
    typeof resolvedParams.customer_id === "string"
      ? resolvedParams.customer_id.trim()
      : undefined;
  const sanitizedCustomerId =
    rawCustomerId && isValidUUID(rawCustomerId) ? rawCustomerId : undefined;

  const rawStatus =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status.trim()
      : undefined;
  const sanitizedStatus: ContactStatus | undefined =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : undefined;

  const rawIsPrimary =
    typeof resolvedParams.is_primary === "string"
      ? resolvedParams.is_primary.trim()
      : undefined;
  const sanitizedIsPrimary: boolean | undefined =
    rawIsPrimary === "true" ? true : rawIsPrimary === "false" ? false : undefined;

  const rawPage =
    typeof resolvedParams.page === "string"
      ? parseInt(resolvedParams.page, 10)
      : 1;
  const sanitizedPage = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawPageSize =
    typeof resolvedParams.page_size === "string"
      ? parseInt(resolvedParams.page_size, 10)
      : 10;
  const sanitizedPageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(
    rawPageSize
  )
    ? rawPageSize
    : 10;

  // Resolve customer name server-side if customer_id filter is active
  let initialCustomerOption: CustomerPickerOption | null = null;
  if (sanitizedCustomerId) {
    try {
      const customer = await getCustomer(sanitizedCustomerId);
      initialCustomerOption = {
        value: customer.id,
        label: customer.name,
        sublabel: customer.company_name ?? null,
      };
    } catch {
      // If customer was deleted or not found, fallback gracefully
      initialCustomerOption = {
        value: sanitizedCustomerId,
        label: "Customer",
        sublabel: null,
      };
    }
  }

  const data = await getContacts({
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    search: sanitizedSearch,
    customerId: sanitizedCustomerId,
    status: sanitizedStatus,
    isPrimary: sanitizedIsPrimary,
  });

  // Safe page correction: page out of bounds
  if (data.meta.total > 0 && sanitizedPage > data.meta.totalPages) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedCustomerId) redirectQuery.set("customer_id", sanitizedCustomerId);
    if (sanitizedStatus) redirectQuery.set("status", sanitizedStatus);
    if (typeof sanitizedIsPrimary === "boolean") {
      redirectQuery.set("is_primary", String(sanitizedIsPrimary));
    }
    redirectQuery.set("page", String(data.meta.totalPages));
    if (sanitizedPageSize !== 10) {
      redirectQuery.set("page_size", String(sanitizedPageSize));
    }

    redirect(`/contacts?${redirectQuery.toString()}`);
  }

  // Safe page correction: empty search/filter results on page > 1
  if (data.meta.total === 0 && sanitizedPage > 1) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedCustomerId) redirectQuery.set("customer_id", sanitizedCustomerId);
    if (sanitizedStatus) redirectQuery.set("status", sanitizedStatus);
    if (typeof sanitizedIsPrimary === "boolean") {
      redirectQuery.set("is_primary", String(sanitizedIsPrimary));
    }
    if (sanitizedPageSize !== 10) {
      redirectQuery.set("page_size", String(sanitizedPageSize));
    }

    redirect(
      redirectQuery.toString()
        ? `/contacts?${redirectQuery.toString()}`
        : "/contacts"
    );
  }

  return (
    <ContactListView
      initialContacts={data.items}
      meta={data.meta}
      currentSearch={sanitizedSearch}
      currentCustomerId={sanitizedCustomerId}
      currentStatus={sanitizedStatus}
      currentIsPrimary={sanitizedIsPrimary}
      initialCustomerOption={initialCustomerOption}
    />
  );
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams;
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={CONTACTS_BREADCRUMBS} />
      <PageHeader
        title="Contacts"
        description="Manage the people connected to your customer relationships."
        action={
          <Link href="/contacts/new">
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
              Add Contact
            </Button>
          </Link>
        }
      />

      <Suspense key={suspenseKey} fallback={<ContactListSkeleton />}>
        <ContactsTableData resolvedParams={params} />
      </Suspense>
    </div>
  );
}
