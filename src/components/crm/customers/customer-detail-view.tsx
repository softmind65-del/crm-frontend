import React from "react";
import { Customer } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import { formatCustomerDateTime } from "@/lib/utils/format";

export interface CustomerDetailViewProps {
  readonly customer: Customer;
}

interface DetailFieldProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly fullWidth?: boolean;
}

function DetailField({ label, value, fullWidth = false }: DetailFieldProps) {
  return (
    <div className={`space-y-1 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-muted-foreground select-none">
        {label}
      </span>
      <div className="text-sm font-medium text-foreground-dark break-words">
        {value}
      </div>
    </div>
  );
}

export function CustomerDetailView({ customer }: CustomerDetailViewProps) {
  const isCompany = customer.customer_type === "company";
  const isActive = customer.status === "active";

  return (
    <div className="space-y-5">
      {/* 1. Customer Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Customer Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Customer Type"
            value={isCompany ? "Company" : "Individual"}
          />
          <DetailField
            label="Company Name"
            value={customer.company_name?.trim() || "—"}
          />
          <DetailField
            label="Status"
            value={
              <Badge
                variant={isActive ? "success" : "neutral"}
                dot={false}
                className="border-transparent px-2.5 py-0.5 font-medium"
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
            }
          />
        </div>
      </section>

      {/* 2. Contact Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Email Address"
            value={
              customer.email?.trim() ? (
                <a
                  href={`mailto:${customer.email.trim()}`}
                  className="text-brand hover:underline font-medium"
                >
                  {customer.email.trim()}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Phone Number"
            value={
              customer.phone?.trim() ? (
                <a
                  href={`tel:${customer.phone.trim()}`}
                  className="text-foreground-dark hover:text-brand font-medium"
                >
                  {customer.phone.trim()}
                </a>
              ) : (
                "—"
              )
            }
          />
        </div>
      </section>

      {/* 3. Address */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Address
        </h2>
        <div className="grid grid-cols-1 gap-y-4">
          <DetailField
            label="Physical Address"
            value={customer.address?.trim() || "—"}
            fullWidth
          />
        </div>
      </section>

      {/* 4. Record Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Record Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Created"
            value={formatCustomerDateTime(customer.created_at)}
          />
          <DetailField
            label="Last Updated"
            value={formatCustomerDateTime(customer.updated_at)}
          />
        </div>
      </section>
    </div>
  );
}
