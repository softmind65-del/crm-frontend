import React from "react";
import Link from "next/link";
import { Contact } from "@/types/contact";
import { formatCustomerDateTime } from "@/lib/utils/format";

export interface ContactDetailViewProps {
  readonly contact: Contact;
  readonly customerName?: string;
  readonly customerExists?: boolean;
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

export function ContactDetailView({
  contact,
  customerName,
  customerExists = true,
}: ContactDetailViewProps) {
  return (
    <div className="space-y-5">
      {/* 1. Customer Relationship */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Customer Relationship
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Customer"
            value={
              customerExists && customerName ? (
                <Link
                  href={`/customers/${contact.customer_id}`}
                  className="text-brand hover:underline font-medium"
                >
                  {customerName}
                </Link>
              ) : (
                <span className="text-muted-foreground">
                  {customerName || "Customer unavailable"}
                </span>
              )
            }
          />
          <DetailField
            label="Primary Contact"
            value={contact.is_primary ? "Yes" : "No"}
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
              contact.email?.trim() ? (
                <a
                  href={`mailto:${contact.email.trim()}`}
                  className="text-brand hover:underline font-medium"
                >
                  {contact.email.trim()}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Phone Number"
            value={
              contact.phone?.trim() ? (
                <a
                  href={`tel:${contact.phone.trim()}`}
                  className="text-foreground-dark hover:text-brand font-medium"
                >
                  {contact.phone.trim()}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Mobile Number"
            value={
              contact.mobile?.trim() ? (
                <a
                  href={`tel:${contact.mobile.trim()}`}
                  className="text-foreground-dark hover:text-brand font-medium"
                >
                  {contact.mobile.trim()}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Job Title"
            value={contact.job_title?.trim() || "—"}
          />
        </div>
      </section>

      {/* 3. Record Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Record Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Created"
            value={formatCustomerDateTime(contact.created_at)}
          />
          <DetailField
            label="Last Updated"
            value={formatCustomerDateTime(contact.updated_at)}
          />
        </div>
      </section>
    </div>
  );
}
