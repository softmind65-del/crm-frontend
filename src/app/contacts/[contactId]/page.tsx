import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { HOME_BREADCRUMB_ITEM, BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { Badge } from "@/components/ui/badge";
import { ToastFlushBridge } from "@/components/ui/toast";
import { ContactDetailView } from "@/components/crm/contacts/contact-detail-view";
import { ContactDetailSkeleton } from "@/components/crm/contacts/contact-detail-skeleton";
import { ContactDetailActions } from "@/components/crm/contacts/contact-detail-actions";
import { getContact } from "@/lib/api/contacts";
import { getCustomer, isValidUUID } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import { Contact } from "@/types/contact";

interface ContactDetailPageProps {
  readonly params: Promise<{
    readonly contactId: string;
  }>;
}

async function ContactDetailData({
  contactId,
}: {
  readonly contactId: string;
}) {
  let contact: Contact;
  try {
    contact = await getContact(contactId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Resolve customer name server-side
  let customerName = "Customer unavailable";
  let customerExists = false;
  try {
    const customer = await getCustomer(contact.customer_id);
    customerName = customer.name;
    customerExists = true;
  } catch {
    customerName = "Customer unavailable";
    customerExists = false;
  }

  const isActive = contact.status === "active";

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Contacts", href: "/contacts" },
    { label: contact.name },
  ];

  return (
    <div className="space-y-6">
      <ToastFlushBridge />
      <PageBreadcrumbs items={breadcrumbs} />

      {/* Page Header with Contact Name & Metadata Row */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground-dark break-words">
            {contact.name}
          </h1>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
            {contact.job_title && (
              <>
                <span className="font-medium text-foreground-dark">
                  {contact.job_title}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  •
                </span>
              </>
            )}
            <Badge
              variant={isActive ? "success" : "neutral"}
              dot={false}
              className="border-transparent px-2.5 py-0.5 font-medium"
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
            {contact.is_primary && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  •
                </span>
                <Badge
                  variant="info"
                  dot={false}
                  className="border-transparent px-2.5 py-0.5 font-medium"
                >
                  Primary
                </Badge>
              </>
            )}
          </div>
        </div>

        <ContactDetailActions
          contactId={contact.id}
          contactName={contact.name}
        />
      </header>

      {/* Structured Contact Details View */}
      <ContactDetailView
        contact={contact}
        customerName={customerName}
        customerExists={customerExists}
      />
    </div>
  );
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { contactId } = await params;

  if (!isValidUUID(contactId)) {
    notFound();
  }

  return (
    <Suspense key={contactId} fallback={<ContactDetailSkeleton />}>
      <ContactDetailData contactId={contactId} />
    </Suspense>
  );
}
