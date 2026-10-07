"use client";

import React from "react";
import { FilterPanel } from "@/components/filters/filter-panel";
import { Select } from "@/components/ui/select";

export interface CustomerFilterValues {
  readonly customer_type: string;
  readonly status: string;
}

export interface CustomerFiltersProps {
  readonly open: boolean;
  readonly draftFilters: CustomerFilterValues;
  readonly onDraftChange: (filters: CustomerFilterValues) => void;
  readonly onClear: () => void;
  readonly onCancel: () => void;
  readonly onApply: () => void;
}

export function CustomerFilters({
  open,
  draftFilters,
  onDraftChange,
  onClear,
  onCancel,
  onApply,
}: CustomerFiltersProps) {
  return (
    <FilterPanel
      open={open}
      title="Filter Customers"
      onClear={onClear}
      onCancel={onCancel}
      onApply={onApply}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Customer Type Filter */}
        <Select
          label="Customer Type"
          value={draftFilters.customer_type}
          onChange={(e) =>
            onDraftChange({
              ...draftFilters,
              customer_type: e.target.value,
            })
          }
        >
          <option value="all">All types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </Select>

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
      </div>
    </FilterPanel>
  );
}
