"use client";

import React from "react";
import { FilterPanel } from "@/components/filters/filter-panel";
import { Select } from "@/components/ui/select";
import { CustomerPicker, CustomerPickerOption } from "@/components/forms/customer-picker";

export interface ContactFilterValues {
  readonly customer_id: string;
  readonly status: string;
  readonly is_primary: string;
}

export interface ContactFiltersProps {
  readonly open: boolean;
  readonly draftFilters: ContactFilterValues;
  readonly initialCustomerOption?: CustomerPickerOption | null;
  readonly onDraftChange: (filters: ContactFilterValues) => void;
  readonly onClear: () => void;
  readonly onCancel: () => void;
  readonly onApply: () => void;
}

export function ContactFilters({
  open,
  draftFilters,
  initialCustomerOption,
  onDraftChange,
  onClear,
  onCancel,
  onApply,
}: ContactFiltersProps) {
  return (
    <FilterPanel
      open={open}
      title="Filter Contacts"
      onClear={onClear}
      onCancel={onCancel}
      onApply={onApply}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Customer Filter */}
        <CustomerPicker
          label="Customer"
          placeholder="All customers"
          value={draftFilters.customer_id || null}
          initialOption={initialCustomerOption}
          onChange={(val) =>
            onDraftChange({
              ...draftFilters,
              customer_id: val ?? "",
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        {/* Primary Contact Filter */}
        <Select
          label="Primary Contact"
          value={draftFilters.is_primary}
          onChange={(e) =>
            onDraftChange({
              ...draftFilters,
              is_primary: e.target.value,
            })
          }
        >
          <option value="all">All</option>
          <option value="true">Primary</option>
          <option value="false">Not primary</option>
        </Select>
      </div>
    </FilterPanel>
  );
}
