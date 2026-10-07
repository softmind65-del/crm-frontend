import { LeadListItem } from "@/types/lead";
import { LeadPipelineStage } from "@/types/pipeline";
import { getStageBadgeClasses } from "@/lib/utils/stage-colors";
import { Badge } from "@/components/ui/badge";
import {
  formatCustomerDateTime,
  formatCurrency,
} from "@/lib/utils/format";
import {
  formatLeadSource,
  formatLeadStatus,
  getLeadStatusBadgeVariant,
} from "@/lib/utils/lead-format";

export interface LeadDetailViewProps {
  readonly lead: LeadListItem;
  readonly stage?: LeadPipelineStage;
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

export function LeadDetailView({ lead, stage }: LeadDetailViewProps) {
  const isConverted = lead.status === "converted";

  return (
    <div className="space-y-5">
      {/* Converted Informational Banner */}
      {isConverted && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-900">
              Converted Lead
            </h4>
            <p className="text-xs text-emerald-800">
              This lead has been successfully converted to a deal and is now read-only historical source data.
            </p>
          </div>
        </div>
      )}

      {/* 1. Customer Relationship */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Customer Relationship
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Customer"
            value={
              <span className="text-foreground-dark font-medium">
                {lead.customer_name}
              </span>
            }
          />
          <DetailField
            label="Contact"
            value={
              lead.contact_name ? (
                <span className="text-foreground-dark font-medium">
                  {lead.contact_name}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        </div>
      </section>

      {/* 2. Lead Information */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Lead Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8">
          <DetailField
            label="Source"
            value={formatLeadSource(lead.source)}
          />
          <DetailField
            label={stage ? "Stage" : "Status"}
            value={
              stage ? (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStageBadgeClasses(
                    stage.color_key
                  )}`}
                >
                  {stage.name}
                </span>
              ) : (
                <Badge
                  variant={getLeadStatusBadgeVariant(lead.status)}
                  dot={false}
                  className="border-transparent px-2.5 py-0.5 font-medium"
                >
                  {formatLeadStatus(lead.status)}
                </Badge>
              )
            }
          />
          <DetailField
            label="Estimated Value"
            value={
              <span className="font-semibold text-foreground-dark">
                {formatCurrency(lead.estimated_value)}
              </span>
            }
          />
        </div>
      </section>

      {/* 3. Notes */}
      <section className="bg-white border border-border-subtle rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-semibold text-foreground-dark pb-3 mb-4 border-b border-border-subtle">
          Notes
        </h2>
        <div className="text-sm text-foreground-dark whitespace-pre-wrap leading-relaxed">
          {lead.notes ? (
            lead.notes
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
          <DetailField
            label="Created At"
            value={formatCustomerDateTime(lead.created_at)}
          />
          <DetailField
            label="Last Updated"
            value={formatCustomerDateTime(lead.updated_at)}
          />
        </div>
      </section>
    </div>
  );
}
