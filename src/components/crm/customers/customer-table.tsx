"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Customer } from "@/types/customer";
import { DataTable, DataTableColumn } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/data-table/table-actions";
import { formatCustomerDate } from "@/lib/utils/format";

export interface CustomerTableProps {
  readonly customers: readonly Customer[];
  readonly onDelete?: (customer: Customer) => void;
  readonly emptyState?: React.ReactNode;
}

export function CustomerTable({
  customers,
  onDelete,
  emptyState,
}: CustomerTableProps) {
  const router = useRouter();
  const columns: readonly DataTableColumn<Customer>[] = [
    {
      key: "customer",
      header: "Customer",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[20%] min-w-[160px]",
      className: "w-[20%] min-w-[160px]",
      render: (row) => (
        <span className="block font-semibold text-foreground-dark truncate max-w-[200px]">
          {row.name}
        </span>
      ),
    },
    {
      key: "company",
      header: "Company",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[20%] min-w-[160px]",
      className: "w-[20%] min-w-[160px]",
      render: (row) => {
        const companyName = row.company_name?.trim();
        return (
          <span
            className={`block text-sm truncate max-w-[190px] ${
              companyName ? "text-foreground-dark" : "text-muted-foreground"
            }`}
          >
            {companyName || "—"}
          </span>
        );
      },
    },
    {
      key: "contact",
      header: "Contact",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[21%] min-w-[180px]",
      className: "w-[21%] min-w-[180px]",
      render: (row) => {
        const email = row.email?.trim();
        const phone = row.phone?.trim();
        return (
          <div className="space-y-0.5">
            <span
              className={`block text-sm truncate max-w-[190px] ${
                email ? "text-foreground-dark" : "text-muted-foreground"
              }`}
            >
              {email || "—"}
            </span>
            <span className="block text-xs text-muted-foreground truncate max-w-[190px]">
              {phone || "—"}
            </span>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[11%] min-w-[90px]",
      className: "w-[11%] min-w-[90px]",
      render: (row) => {
        const isCompany = row.customer_type === "company";
        return (
          <span className="text-sm font-medium text-foreground-dark">
            {isCompany ? "Company" : "Individual"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[11%] min-w-[90px]",
      className: "w-[11%] min-w-[90px]",
      render: (row) => {
        const isActive = row.status === "active";
        return (
          <Badge
            variant={isActive ? "success" : "neutral"}
            dot={false}
            className="border-transparent px-2.5 py-0.5 font-medium"
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "updated",
      header: "Updated",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[11%] min-w-[95px]",
      className: "w-[11%] min-w-[95px]",
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
      headerClassName: "text-brand font-semibold text-xs sm:text-sm text-right w-[6%] min-w-[65px]",
      className: "text-right w-[6%] min-w-[65px]",
      render: (row) => (
        <TableActions
          actions={[
            {
              label: "View",
              onSelect: () => router.push(`/customers/${row.id}`),
            },
            {
              label: "Edit",
              disabled: false,
              onSelect: () => router.push(`/customers/${row.id}/edit`),
            },
            {
              label: "Delete",
              variant: "danger",
              disabled: false,
              onSelect: () => onDelete?.(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={customers}
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
