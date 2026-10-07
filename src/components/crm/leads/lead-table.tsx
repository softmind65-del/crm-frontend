"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LeadListItem } from "@/types/lead";
import { DataTable, DataTableColumn } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/data-table/table-actions";
import { formatCustomerDate, formatCurrency } from "@/lib/utils/format";
import {
  formatLeadSource,
  formatLeadStatus,
  getLeadStatusBadgeVariant,
} from "@/lib/utils/lead-format";

export interface LeadTableProps {
  readonly leads: readonly LeadListItem[];
  readonly onDelete?: (lead: LeadListItem) => void;
  readonly emptyState?: React.ReactNode;
}

export function LeadTable({ leads, onDelete, emptyState }: LeadTableProps) {
  const router = useRouter();

  const columns: readonly DataTableColumn<LeadListItem>[] = [
    {
      key: "lead",
      header: "Lead",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[20%] min-w-[160px]",
      className: "w-[20%] min-w-[160px]",
      render: (row) => (
        <span className="block font-semibold text-foreground-dark truncate max-w-[200px]">
          {row.title}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[18%] min-w-[150px]",
      className: "w-[18%] min-w-[150px]",
      render: (row) => (
        <span className="block text-sm font-medium text-foreground-dark truncate max-w-[190px]">
          {row.customer_name}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[14%] min-w-[120px]",
      className: "w-[14%] min-w-[120px]",
      render: (row) => (
        <span className="block text-sm text-foreground-dark truncate max-w-[150px]">
          {row.contact_name ? (
            row.contact_name
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[11%] min-w-[90px]",
      className: "w-[11%] min-w-[90px]",
      render: (row) => (
        <span className="text-sm text-foreground-dark">
          {formatLeadSource(row.source)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[11%] min-w-[90px]",
      className: "w-[11%] min-w-[90px]",
      render: (row) => (
        <Badge
          variant={getLeadStatusBadgeVariant(row.status)}
          dot={false}
          className="border-transparent px-2.5 py-0.5 font-medium"
        >
          {formatLeadStatus(row.status)}
        </Badge>
      ),
    },
    {
      key: "estimated_value",
      header: "Estimated Value",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[14%] min-w-[120px]",
      className: "w-[14%] min-w-[120px]",
      render: (row) => (
        <span className="text-sm font-medium text-foreground-dark">
          {formatCurrency(row.estimated_value)}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[10%] min-w-[85px]",
      className: "w-[10%] min-w-[85px]",
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatCustomerDate(row.updated_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm text-right w-[6%] min-w-[55px]",
      className: "text-right w-[6%] min-w-[55px]",
      render: (row) => {
        const isConverted = row.status === "converted";
        return (
          <TableActions
            actions={[
              {
                label: "View",
                disabled: false,
                onSelect: () => router.push(`/leads/${row.id}`),
              },
              {
                label: "Edit",
                disabled: isConverted,
                onSelect: () => router.push(`/leads/${row.id}/edit`),
              },
              {
                label: "Delete",
                variant: "danger",
                disabled: isConverted,
                onSelect: () => onDelete?.(row),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <DataTable
      data={leads}
      columns={columns}
      getRowKey={(row) => row.id}
      emptyState={emptyState}
      className="border-none rounded-none"
      theadClassName="bg-white border-b border-slate-200/90"
      tbodyClassName="divide-y divide-slate-100 bg-white"
      cellPaddingClassName="px-4 py-3.5"
    />
  );
}
