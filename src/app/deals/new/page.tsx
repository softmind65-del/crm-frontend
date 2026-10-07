import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { DealForm } from "@/components/crm/deals/deal-form";

const ADD_DEAL_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Deals", href: "/deals" },
  { label: "Add Deal" },
] as const;

export default function AddDealPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={ADD_DEAL_BREADCRUMBS} />
      <PageHeader
        title="Add Deal"
        description="Create a new sales opportunity in the CRM."
      />

      <DealForm />
    </div>
  );
}
