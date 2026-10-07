"use client";

import React from "react";
import { FilterPanel } from "@/components/filters/filter-panel";
import { Select } from "@/components/ui/select";
import { CustomerPicker, CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPicker, ContactPickerOption } from "@/components/forms/contact-picker";

export interface LeadFilterValues {
  readonly customer_id: string;
  readonly contact_id: string;
  readonly status: string;
  readonly source: string;
}

export interface LeadFiltersProps {
  readonly open: boolean;
  readonly draftFilters: LeadFilterValues;
  readonly initialCustomerOption?: CustomerPickerOption | null;
  readonly initialContactOption?: ContactPickerOption | null;
  readonly onDraftChange: (filters: LeadFilterValues) => void;
  readonly onClear: () => void;
  readonly onCancel: () => void;
  readonly onApply: () => void;
}

export function LeadFilters({
  open,
  draftFilters,
  initialCustomerOption,
  initialContactOption,
  onDraftChange,
  onClear,
  onCancel,
  onApply,
}: LeadFiltersProps) {
  const handleCustomerChange = (val: string | null) => {
    const newCustomerId = val ?? "";
    // If customer changed or cleared, clear contact_id
    const newContactId = newCustomerId === draftFilters.customer_id ? draftFilters.contact_id : "";

    onDraftChange({
      ...draftFilters,
      customer_id: newCustomerId,
      contact_id: newContactId,
    });
  };

  return (
    <FilterPanel
      open={open}
      title="Filter Leads"
      onClear={onClear}
      onCancel={onCancel}
      onApply={onApply}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Filter */}
        <CustomerPicker
          label="Customer"
          placeholder="All customers"
          initialOption={initialCustomerOption}
          value={draftFilters.customer_id || null}
          onChange={handleCustomerChange}
        />

        {/* Contact Filter (scoped to selected customer) */}
        <ContactPicker
          label="Contact"
          placeholder={draftFilters.customer_id ? "All contacts" : "Select a customer first"}
          customerId={draftFilters.customer_id || null}
          initialOption={initialContactOption}
          value={draftFilters.contact_id || null}
          onChange={(val) =>
            onDraftChange({
              ...draftFilters,
              contact_id: val ?? "",
            })
          }
        />

        {/* Status Filter */}
        <Select
          label="Status"
          value={draftFilters.status}
          onChange={(e) =>
            onDraftChange({
              ...draftFilters,
              status: e.target.value,
            })
          }
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="unqualified">Unqualified</option>
          <option value="converted">Converted</option>
        </Select>

        {/* Source Filter */}
        <Select
          label="Source"
          value={draftFilters.source}
          onChange={(e) =>
            onDraftChange({
              ...draftFilters,
              source: e.target.value,
            })
          }
        >
          <option value="all">All sources</option>
          <option value="website">Website</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="referral">Referral</option>
          <option value="email">Email</option>
          <option value="phone_call">Phone Call</option>
          <option value="walk_in">Walk-in</option>
          <option value="event">Event</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="other">Other</option>
        </Select>
      </div>
    </FilterPanel>
  );
}
