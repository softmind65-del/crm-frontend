import { StageColorKey } from "@/types/pipeline";
export type { StageColorKey };

/**
 * Deal pipeline stages defined by the AccDoo CRM domain.
 * Strictly aligned with backend DealStage enum:
 * "new" | "proposal" | "negotiation" | "won" | "lost"
 */
export type DealStage = "new" | "proposal" | "negotiation" | "won" | "lost";

export const DEAL_STAGES: readonly DealStage[] = [
  "new",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

/**
 * Deal stage display labels.
 */
export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  new: "New",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

/**
 * Deal entity representing a sales opportunity.
 */
export interface Deal {
  readonly id: string;
  readonly user_id?: string;
  readonly customer_id: string;
  readonly customer_name: string;
  readonly contact_id: string | null;
  readonly contact_name?: string | null;
  readonly lead_id?: string | null;
  readonly title: string;
  readonly stage: DealStage;
  readonly pipeline_stage_id: string;
  readonly value: number | null;
  readonly expected_close_date: string | null;
  readonly assigned_to_user_id?: string | null;
  readonly assigned_to_name?: string | null;
  readonly notes: string | null;
  readonly closed_at?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Deal Pipeline stage entity.
 */
export interface DealPipelineStage {
  readonly id: string;
  readonly name: string;
  readonly color_key: StageColorKey;
  readonly position: number;
  readonly legacy_stage_key?: DealStage | null;
  readonly is_entry_stage: boolean;
  readonly is_system_won: boolean;
  readonly is_system_lost: boolean;
  readonly custom_color_hex?: string | null;
  readonly description?: string;
}

/**
 * Backward-compatible stage definition alias.
 */
export type DealPipelineStageMock = DealPipelineStage;

/**
 * Deal Pipeline container entity.
 */
export interface DealPipeline {
  readonly id: string;
  readonly name: string;
  readonly is_default: boolean;
  readonly version: number;
  readonly stages: readonly DealPipelineStage[];
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Summary metrics for a pipeline stage.
 */
export interface DealPipelineStageSummary {
  readonly stage_id: string;
  readonly deal_count: number;
  readonly total_value: number;
}

/**
 * Deal card representation on the Pipeline Kanban board.
 */
export type DealPipelineCardMock = Deal;

/**
 * Legacy summary metrics for a pipeline stage column by DealStage.
 */
export interface DealStageSummary {
  readonly stage: DealStage;
  readonly deal_count: number;
  readonly total_value: number;
}

/**
 * Client-side filter values for Deal views.
 */
export interface DealFilterValues {
  readonly customer_id: string;
  readonly contact_id: string;
  readonly stage_id: string;
  readonly stage?: string;
}

export interface CreateDealStageInput {
  readonly name: string;
  readonly color_key: StageColorKey;
  readonly version: number;
  readonly custom_color_hex?: string | null;
}

export interface UpdateDealStageInput {
  name?: string;
  color_key?: StageColorKey;
  version: number;
  custom_color_hex?: string | null;
}

export interface ReorderDealStagesInput {
  readonly stage_ids: readonly string[];
  readonly version: number;
}

export interface SetEntryStageInput {
  readonly version: number;
}

export interface ArchiveDealStageInput {
  readonly destination_stage_id?: string | null;
  readonly version: number;
}

export interface ResetDealPipelineInput {
  readonly version: number;
}

export interface DealListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly customerId?: string;
  readonly contactId?: string;
  readonly leadId?: string;
  readonly stage?: DealStage;
  readonly stageId?: string;
}

export interface GetDealsResult {
  readonly items: readonly Deal[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
}

export interface CreateDealInput {
  readonly title: string;
  readonly customer_id: string;
  readonly contact_id?: string | null;
  readonly value?: number | null;
  readonly expected_close_date?: string | null;
  readonly notes?: string | null;
}

export interface UpdateDealInput {
  title?: string;
  customer_id?: string;
  contact_id?: string | null;
  value?: number | null;
  expected_close_date?: string | null;
  notes?: string | null;
}

