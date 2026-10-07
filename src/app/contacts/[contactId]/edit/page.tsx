import React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  HOME_BREADCRUMB_ITEM,
  BreadcrumbItem,
} from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { ContactForm } from "@/components/crm/contacts/contact-form";
import { getContact } from "@/lib/api/contacts";
import { getCustomer, isValidUUID } from "@/lib/api/customers";
import { BackendApiError } from "@/types/api";
import { Contact } from "@/types/contact";

interface ContactEditPageProps {
  readonly params: Promise<{
    readonly contactId: string;
  }>;
}

export default async function ContactEditPage({
  params,
}: ContactEditPageProps) {
  const { contactId } = await params;

  if (!isValidUUID(contactId)) {
    notFound();
  }

  let contact: Contact;
  try {
    contact = await getContact(contactId);
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  // Resolve customer name server-side for read-only relationship display
  let customerName = "Customer unavailable";
  try {
    const customer = await getCustomer(contact.customer_id);
    customerName = customer.name;
  } catch {
    customerName = "Customer unavailable";
  }

  const breadcrumbs: readonly BreadcrumbItem[] = [
    HOME_BREADCRUMB_ITEM,
    { label: "Contacts", href: "/contacts" },
    { label: contact.name, href: `/contacts/${contactId}` },
    { label: "Edit" },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={breadcrumbs} />
      <PageHeader
        title="Edit Contact"
        description="Update contact information and details."
      />

      <ContactForm
        mode="edit"
        contactId={contactId}
        initialValues={contact}
        customerName={customerName}
      />
    </div>
  );
}
