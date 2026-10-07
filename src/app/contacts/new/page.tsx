import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { ContactForm } from "@/components/crm/contacts/contact-form";

const ADD_CONTACT_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Contacts", href: "/contacts" },
  { label: "Add Contact" },
] as const;

export default function AddContactPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={ADD_CONTACT_BREADCRUMBS} />
      <PageHeader
        title="Add Contact"
        description="Create a contact and link them to a customer."
      />

      <ContactForm />
    </div>
  );
}
