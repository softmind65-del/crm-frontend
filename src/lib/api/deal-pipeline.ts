import "server-only";

import { backendFetch } from "@/lib/api/backend-client";
import { isValidUUID } from "@/lib/utils/uuid";
import { ApiSuccessResponse, BackendApiError } from "@/types/api";
import {
  DealPipeline,
  DealPipelineStage,
  DealPipelineStageSummary,
  CreateDealStageInput,
  UpdateDealStageInput,
  ReorderDealStagesInput,
  SetEntryStageInput,
  ArchiveDealStageInput,
  ResetDealPipelineInput,
} from "@/types/deal";

function validateDealPipelineEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<DealPipeline> {
  if (!payload || typeof payload !== "object") return false;
  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const d = res.data as Record<string, unknown>;
  if (
    typeof d.id !== "string" ||
    typeof d.name !== "string" ||
    typeof d.is_default !== "boolean" ||
    typeof d.version !== "number" ||
    !Array.isArray(d.stages)
  ) {
    return false;
  }

  for (const s of d.stages) {
    if (!s || typeof s !== "object") return false;
    const stage = s as Record<string, unknown>;
    if (
      typeof stage.id !== "string" ||
      typeof stage.name !== "string" ||
      typeof stage.color_key !== "string" ||
      typeof stage.position !== "number" ||
      typeof stage.is_entry_stage !== "boolean" ||
      typeof stage.is_system_won !== "boolean" ||
      typeof stage.is_system_lost !== "boolean" ||
      (stage.custom_color_hex !== undefined &&
        stage.custom_color_hex !== null &&
        typeof stage.custom_color_hex !== "string")
    ) {
      return false;
    }
  }

  return true;
}

function validateSummaryEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<unknown[]> {
  if (!payload || typeof payload !== "object") return false;
  const res = payload as Record<string, unknown>;
  if (res.success !== true || !Array.isArray(res.data)) {
    return false;
  }
  return true;
}

function normalizeDealSummary(raw: unknown[]): DealPipelineStageSummary[] {
  return raw.map((item) => {
    const s = item as Record<string, unknown>;
    const val = s.total_value;
    const numVal =
      typeof val === "number"
        ? val
        : typeof val === "string"
        ? parseFloat(val)
        : 0;
    const stageId =
      typeof s.stage_id === "string"
        ? s.stage_id
        : typeof s.id === "string"
        ? s.id
        : "";
    return {
      stage_id: stageId,
      deal_count: typeof s.deal_count === "number" ? s.deal_count : 0,
      total_value: isNaN(numVal) ? 0 : numVal,
    };
  });
}

function sortStagesAscending(pipeline: DealPipeline): DealPipeline {
  const sortedStages: DealPipelineStage[] = [...pipeline.stages].sort(
    (a, b) => a.position - b.position
  );
  return {
    ...pipeline,
    stages: sortedStages,
  };
}

/**
 * Retrieves the current authenticated user's default deal pipeline.
 */
export async function getDealPipeline(): Promise<DealPipeline> {
  const endpoint = "/api/v1/deal-pipeline";
  const response = await backendFetch<unknown>(endpoint);

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal pipeline data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Retrieves aggregated per-stage board summary metrics for deals.
 */
export async function getDealPipelineSummary(): Promise<DealPipelineStageSummary[]> {
  const endpoint = "/api/v1/deal-pipeline/summary";
  const response = await backendFetch<unknown>(endpoint);

  if (!validateSummaryEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal pipeline summary from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return normalizeDealSummary(response.data);
}

/**
 * Adds a new stage to the current user's deal pipeline immediately before Won and Lost.
 */
export async function createDealPipelineStage(
  input: CreateDealStageInput
): Promise<DealPipeline> {
  const endpoint = "/api/v1/deal-pipeline/stages";
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    color_key: input.color_key,
    version: input.version,
  };
  if (input.custom_color_hex !== undefined) {
    payload.custom_color_hex = input.custom_color_hex;
  }

  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after creating stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Updates display name and/or semantic color for an existing deal pipeline stage.
 */
export async function updateDealPipelineStage(
  stageId: string,
  input: UpdateDealStageInput
): Promise<DealPipeline> {
  const trimmedId = stageId?.trim() ?? "";
  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Invalid stage ID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/deal-pipeline/stages/${encodeURIComponent(trimmedId)}`;
  const payload: Record<string, unknown> = {
    version: input.version,
  };
  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }
  if (input.color_key !== undefined) {
    payload.color_key = input.color_key;
  }
  if (input.custom_color_hex !== undefined) {
    payload.custom_color_hex = input.custom_color_hex;
  }

  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after updating stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Reorders active open stages. Won is pinned second-last and Lost pinned last by backend.
 */
export async function reorderDealPipelineStages(
  input: ReorderDealStagesInput
): Promise<DealPipeline> {
  const endpoint = "/api/v1/deal-pipeline/stages/reorder";
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      stage_ids: input.stage_ids,
      version: input.version,
    }),
  });

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after reordering stages.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Designates an active stage as the Deal entry stage for new deals.
 */
export async function setDealEntryStage(
  stageId: string,
  input: SetEntryStageInput
): Promise<DealPipeline> {
  const trimmedId = stageId?.trim() ?? "";
  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Invalid stage ID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/deal-pipeline/stages/${encodeURIComponent(trimmedId)}/set-entry`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      version: input.version,
    }),
  });

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after setting entry stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Soft-archives an active stage and reassigns referencing deals to a target destination.
 */
export async function archiveDealPipelineStage(
  stageId: string,
  input: ArchiveDealStageInput
): Promise<DealPipeline> {
  const trimmedId = stageId?.trim() ?? "";
  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Invalid stage ID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/deal-pipeline/stages/${encodeURIComponent(trimmedId)}/archive`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      destination_stage_id: input.destination_stage_id ?? null,
      version: input.version,
    }),
  });

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after archiving stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Resets the deal pipeline configuration to system default stages and colors.
 */
export async function resetDealPipelineDefaults(
  input: ResetDealPipelineInput
): Promise<DealPipeline> {
  const endpoint = "/api/v1/deal-pipeline/reset-defaults";
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      version: input.version,
    }),
  });

  if (!validateDealPipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after resetting pipeline defaults.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}
