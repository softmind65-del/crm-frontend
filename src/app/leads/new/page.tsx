import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HOME_BREADCRUMB_ITEM } from "@/components/layout/breadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/breadcrumbs-context";
import { LeadForm } from "@/components/crm/leads/lead-form";

import { getLeadPipeline } from "@/lib/api/lead-pipeline";

const ADD_LEAD_BREADCRUMBS = [
  HOME_BREADCRUMB_ITEM,
  { label: "Leads", href: "/leads" },
  { label: "Add Lead" },
] as const;

export default async function AddLeadPage() {
  const pipeline = await getLeadPipeline().catch(() => null);

  return (
    <div className="space-y-6">
      <PageBreadcrumbs items={ADD_LEAD_BREADCRUMBS} />
      <PageHeader
        title="Add Lead"
        description="Create and qualify a new sales opportunity."
      />

      <LeadForm stages={pipeline?.stages} />
    </div>
  );
}
