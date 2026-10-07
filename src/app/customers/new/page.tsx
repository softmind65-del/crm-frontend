import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { CustomerForm } from "@/components/crm/customers/customer-form";

const ADD_CUSTOMER_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Customers", href: "/customers" },
  { label: "Add Customer" },
] as const;

export default function AddCustomerPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={ADD_CUSTOMER_BREADCRUMBS} />
      <PageHeader
        title="Add Customer"
        description="Create a new customer record and contact profile."
      />

      <CustomerForm />
    </div>
  );
}
