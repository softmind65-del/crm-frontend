"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ContactListItem } from "@/types/contact";
import { DataTable, DataTableColumn } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/data-table/table-actions";
import { formatCustomerDate } from "@/lib/utils/format";

export interface ContactTableProps {
  readonly contacts: readonly ContactListItem[];
  readonly onDelete?: (contact: ContactListItem) => void;
  readonly emptyState?: React.ReactNode;
}

export function ContactTable({ contacts, onDelete, emptyState }: ContactTableProps) {
  const router = useRouter();

  const columns: readonly DataTableColumn<ContactListItem>[] = [
    {
      key: "contact",
      header: "Contact",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[20%] min-w-[160px]",
      className: "w-[20%] min-w-[160px]",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="block font-semibold text-foreground-dark truncate max-w-[200px]">
            {row.name}
          </span>
          {row.job_title && (
            <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
              {row.job_title}
            </span>
          )}
        </div>
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
      key: "contact_details",
      header: "Contact Details",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[22%] min-w-[180px]",
      className: "w-[22%] min-w-[180px]",
      render: (row) => {
        const email = row.email?.trim() || null;
        const mobile = row.mobile?.trim() || null;
        const phone = row.phone?.trim() || null;
        const secondaryPhone = mobile || phone;

        if (email && secondaryPhone) {
          return (
            <div className="space-y-0.5">
              <span className="block text-sm text-foreground-dark truncate max-w-[200px]">
                {email}
              </span>
              <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                {secondaryPhone}
              </span>
            </div>
          );
        }

        if (email) {
          return (
            <span className="block text-sm text-foreground-dark truncate max-w-[200px]">
              {email}
            </span>
          );
        }

        if (secondaryPhone) {
          return (
            <span className="block text-sm text-foreground-dark truncate max-w-[200px]">
              {secondaryPhone}
            </span>
          );
        }

        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      key: "primary",
      header: "Primary",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[10%] min-w-[80px]",
      className: "w-[10%] min-w-[80px]",
      render: (row) => {
        if (row.is_primary) {
          return (
            <Badge
              variant="info"
              dot={false}
              className="border-transparent px-2.5 py-0.5 font-medium"
            >
              Primary
            </Badge>
          );
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[10%] min-w-[80px]",
      className: "w-[10%] min-w-[80px]",
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
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[12%] min-w-[95px]",
      className: "w-[12%] min-w-[95px]",
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
      headerClassName: "text-brand font-semibold text-xs sm:text-sm text-right w-[8%] min-w-[65px]",
      className: "text-right w-[8%] min-w-[65px]",
      render: (row) => (
        <TableActions
          actions={[
            {
              label: "View",
              disabled: false,
              onSelect: () => router.push(`/contacts/${row.id}`),
            },
            {
              label: "Edit",
              disabled: false,
              onSelect: () => router.push(`/contacts/${row.id}/edit`),
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
      data={contacts}
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
