import React from "react";
import { Deal, DealPipelineStage, DEAL_STAGE_LABELS } from "@/types/deal";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatCustomerDateTime } from "@/lib/utils/format";
import { formatDealCloseDate } from "@/lib/utils/deal-format";
import { resolveStageColor } from "@/lib/utils/stage-colors";

export interface DealDetailViewProps {
  readonly deal: Deal;
  readonly stage?: DealPipelineStage;
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

export function DealDetailView({ deal, stage }: DealDetailViewProps) {
  const stageStyle = stage
    ? resolveStageColor(stage.color_key, stage.custom_color_hex)
    : resolveStageColor("blue");

  const stageLabel = stage ? stage.name : DEAL_STAGE_LABELS[deal.stage] ?? deal.stage;

  return (
    <div className="space-y-5">
      {/* 1. Customer Relationship */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Customer Relationship
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Customer / Company"
            value={
              <span className="text-foreground-dark font-medium">
                {deal.customer_name}
              </span>
            }
          />
          <DetailField
            label="Primary Contact"
            value={
              deal.contact_name ? (
                <span className="text-foreground-dark font-medium">
                  {deal.contact_name}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        </div>
      </section>

      {/* 2. Deal Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Deal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8">
          <DetailField
            label="Stage"
            value={
              <Badge
                variant={stageStyle.badgeVariant}
                dot={false}
                className={`border px-2.5 py-0.5 text-xs font-semibold ${stageStyle.badgeClass}`}
                style={stageStyle.isCustom ? stageStyle.badgeStyle : undefined}
              >
                {stageLabel}
              </Badge>
            }
          />
          <DetailField
            label="Deal Value"
            value={
              <span className="font-semibold text-foreground-dark">
                {formatCurrency(deal.value)}
              </span>
            }
          />
          <DetailField
            label="Expected Close Date"
            value={
              <span className="font-medium text-foreground-dark">
                {formatDealCloseDate(deal.expected_close_date)}
              </span>
            }
          />
        </div>
      </section>

      {/* 3. Notes */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Internal Notes
        </h2>
        <div className="text-sm text-foreground-dark whitespace-pre-wrap leading-relaxed">
          {deal.notes ? (
            deal.notes
          ) : (
            <span className="text-muted-foreground italic">No notes provided.</span>
          )}
        </div>
      </section>

      {/* 4. Record Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Record Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
          <DetailField
            label="Created At"
            value={formatCustomerDateTime(deal.created_at)}
          />
          <DetailField
            label="Last Updated"
            value={formatCustomerDateTime(deal.updated_at)}
          />
          {deal.closed_at && (
            <DetailField
              label="Closed At"
              value={formatCustomerDateTime(deal.closed_at)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
