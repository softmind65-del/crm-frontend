"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Deal,
  DealPipelineStage,
  DEAL_STAGE_LABELS,
} from "@/types/deal";
import { DataTable, DataTableColumn } from "@/components/data-table/data-table";
import { TableActions } from "@/components/data-table/table-actions";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import { formatDealCloseDate } from "@/lib/utils/deal-format";
import { resolveStageColor } from "@/lib/utils/stage-colors";

export interface DealTableProps {
  readonly deals: readonly Deal[];
  readonly stages?: readonly DealPipelineStage[];
  readonly onDelete?: (deal: Deal) => void;
  readonly emptyState?: React.ReactNode;
}

export function DealTable({
  deals,
  stages = [],
  onDelete,
  emptyState,
}: DealTableProps) {
  const router = useRouter();

  const columns: readonly DataTableColumn<Deal>[] = [
    {
      key: "title",
      header: "Deal Title",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[22%] min-w-[180px]",
      className: "w-[22%] min-w-[180px]",
      render: (row) => (
        <Link
          href={`/deals/${row.id}`}
          className="font-semibold text-foreground-dark hover:text-brand transition-colors block truncate max-w-[220px]"
        >
          {row.title}
        </Link>
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
      key: "stage",
      header: "Stage",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[12%] min-w-[95px]",
      className: "w-[12%] min-w-[95px]",
      render: (row) => {
        const matchedStage =
          stages.find((s) => s.id === row.pipeline_stage_id) ??
          stages.find((s) => s.legacy_stage_key === row.stage);

        const resolved = matchedStage
          ? resolveStageColor(matchedStage.color_key, matchedStage.custom_color_hex)
          : resolveStageColor("blue");

        const stageName = matchedStage
          ? matchedStage.name
          : DEAL_STAGE_LABELS[row.stage] ?? row.stage;

        return (
          <Badge
            variant={resolved.badgeVariant}
            dot={false}
            className={`border px-2.5 py-0.5 text-xs font-semibold truncate ${resolved.badgeClass}`}
            style={resolved.isCustom ? resolved.badgeStyle : undefined}
          >
            {stageName}
          </Badge>
        );
      },
    },
    {
      key: "value",
      header: "Deal Value",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[14%] min-w-[120px]",
      className: "w-[14%] min-w-[120px]",
      render: (row) => (
        <span className="text-sm font-medium text-foreground-dark">
          {formatCurrency(row.value)}
        </span>
      ),
    },
    {
      key: "expected_close",
      header: "Expected Close",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm w-[12%] min-w-[100px]",
      className: "w-[12%] min-w-[100px]",
      render: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDealCloseDate(row.expected_close_date)}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      align: "right",
      headerClassName: "text-brand font-semibold text-xs sm:text-sm text-right w-[6%] min-w-[55px]",
      className: "text-right w-[6%] min-w-[55px]",
      render: (row) => (
        <TableActions
          actions={[
            {
              label: "Edit",
              disabled: false,
              onSelect: () => router.push(`/deals/${row.id}/edit`),
            },
            {
              label: "View details",
              disabled: false,
              onSelect: () => router.push(`/deals/${row.id}`),
            },
            {
              label: "View in Pipeline",
              disabled: false,
              onSelect: () => router.push(`/deals/pipeline`),
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
      data={deals}
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
