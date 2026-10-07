"use client";

import React from "react";
import { FilterPanel } from "@/components/filters/filter-panel";
import { Select } from "@/components/ui/select";
import { CustomerPicker, CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPicker, ContactPickerOption } from "@/components/forms/contact-picker";
import { DealFilterValues, DealPipelineStage } from "@/types/deal";

export interface DealFiltersProps {
  readonly open: boolean;
  readonly stages?: readonly DealPipelineStage[];
  readonly draftFilters: DealFilterValues;
  readonly initialCustomerOption?: CustomerPickerOption | null;
  readonly initialContactOption?: ContactPickerOption | null;
  readonly onDraftChange: (filters: DealFilterValues) => void;
  readonly onClear: () => void;
  readonly onCancel: () => void;
  readonly onApply: () => void;
}

export function DealFilters({
  open,
  stages = [],
  draftFilters,
  initialCustomerOption,
  initialContactOption,
  onDraftChange,
  onClear,
  onCancel,
  onApply,
}: DealFiltersProps) {
  const handleCustomerChange = (val: string | null) => {
    const newCustomerId = val ?? "";
    // If customer changed or cleared, clear contact_id
    const newContactId =
      newCustomerId === draftFilters.customer_id ? draftFilters.contact_id : "";

    onDraftChange({
      ...draftFilters,
      customer_id: newCustomerId,
      contact_id: newContactId,
    });
  };

  return (
    <FilterPanel
      open={open}
      title="Filter Deals"
      onClear={onClear}
      onCancel={onCancel}
      onApply={onApply}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Customer Filter */}
        <CustomerPicker
          label="Customer / Company"
          placeholder="All customers"
          initialOption={initialCustomerOption}
          value={draftFilters.customer_id || null}
          onChange={handleCustomerChange}
        />

        {/* Contact Filter (scoped to selected customer) */}
        <ContactPicker
          label="Primary Contact"
          placeholder={
            draftFilters.customer_id
              ? "All contacts"
              : "Select a customer first"
          }
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

        {/* Stage Filter (populated dynamically from Deal Pipeline) */}
        <Select
          label="Stage"
          value={draftFilters.stage_id || "all"}
          onChange={(e) => {
            const val = e.target.value;
            onDraftChange({
              ...draftFilters,
              stage_id: val !== "all" ? val : "",
            });
          }}
        >
          <option value="all">All stages</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
    </FilterPanel>
  );
}
