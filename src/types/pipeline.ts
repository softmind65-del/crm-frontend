export type StageColorKey =
  | "blue"
  | "cyan"
  | "green"
  | "amber"
  | "orange"
  | "rose"
  | "red"
  | "purple"
  | "violet"
  | "indigo"
  | "slate";

export interface LeadPipelineStage {
  readonly id: string;
  readonly name: string;
  readonly color_key: StageColorKey;
  readonly position: number;
  readonly is_conversion_stage: boolean;
  readonly is_system_converted: boolean;
  readonly custom_color_hex?: string | null;
}

export interface LeadPipeline {
  readonly id: string;
  readonly name: string;
  readonly is_default: boolean;
  readonly version: number;
  readonly stages: readonly LeadPipelineStage[];
  readonly created_at: string;
  readonly updated_at: string;
}

export interface LeadPipelineStageSummary {
  readonly stage_id: string;
  readonly lead_count: number;
  readonly total_estimated_value: number;
}

export interface CreateStageInput {
  readonly name: string;
  readonly color_key: StageColorKey;
  readonly version: number;
  readonly custom_color_hex?: string | null;
}

export interface UpdateStageInput {
  readonly name?: string;
  readonly color_key?: StageColorKey;
  readonly version: number;
  readonly custom_color_hex?: string | null;
}

export interface ReorderStagesInput {
  readonly stage_ids: readonly string[];
  readonly version: number;
}

export interface SetConversionStageInput {
  readonly version: number;
}

export interface ArchiveStageInput {
  readonly destination_stage_id?: string | null;
  readonly version: number;
}
