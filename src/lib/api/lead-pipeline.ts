import "server-only";

import { backendFetch } from "@/lib/api/backend-client";
import { isValidUUID } from "@/lib/utils/uuid";
import { ApiSuccessResponse, BackendApiError } from "@/types/api";
import {
  LeadPipeline,
  LeadPipelineStage,
  LeadPipelineStageSummary,
  CreateStageInput,
  UpdateStageInput,
  ReorderStagesInput,
  SetConversionStageInput,
  ArchiveStageInput,
} from "@/types/pipeline";
import { Lead } from "@/types/lead";

function validatePipelineEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<LeadPipeline> {
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
      typeof stage.is_conversion_stage !== "boolean" ||
      typeof stage.is_system_converted !== "boolean" ||
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

function normalizeSummary(raw: unknown[]): LeadPipelineStageSummary[] {
  return raw.map((item) => {
    const s = item as Record<string, unknown>;
    const val = s.total_estimated_value;
    const numVal =
      typeof val === "number"
        ? val
        : typeof val === "string"
        ? parseFloat(val)
        : 0;
    return {
      stage_id: typeof s.stage_id === "string" ? s.stage_id : "",
      lead_count: typeof s.lead_count === "number" ? s.lead_count : 0,
      total_estimated_value: isNaN(numVal) ? 0 : numVal,
    };
  });
}

function sortStagesAscending(pipeline: LeadPipeline): LeadPipeline {
  const sortedStages: LeadPipelineStage[] = [...pipeline.stages].sort(
    (a, b) => a.position - b.position
  );
  return {
    ...pipeline,
    stages: sortedStages,
  };
}

/**
 * Retrieves the current authenticated user's default lead pipeline.
 */
export async function getLeadPipeline(): Promise<LeadPipeline> {
  const endpoint = "/api/v1/lead-pipeline";
  const response = await backendFetch<unknown>(endpoint);

  if (!validatePipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed lead pipeline data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Retrieves aggregated per-stage board summary metrics.
 */
export async function getLeadPipelineSummary(): Promise<LeadPipelineStageSummary[]> {
  const endpoint = "/api/v1/lead-pipeline/summary";
  const response = await backendFetch<unknown>(endpoint);

  if (!validateSummaryEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed lead pipeline summary from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return normalizeSummary(response.data);
}

/**
 * Adds a new stage to the current user's lead pipeline immediately before system Converted.
 */
export async function createPipelineStage(
  input: CreateStageInput
): Promise<LeadPipeline> {
  const endpoint = "/api/v1/lead-pipeline/stages";
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

  if (!validatePipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after creating stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Updates display name and/or semantic color for an existing pipeline stage.
 */
export async function updatePipelineStage(
  stageId: string,
  input: UpdateStageInput
): Promise<LeadPipeline> {
  const trimmedId = stageId?.trim() ?? "";
  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Invalid stage ID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/lead-pipeline/stages/${encodeURIComponent(trimmedId)}`;
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

  if (!validatePipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after updating stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Reorders active normal stages. System Converted stage is pinned last by backend.
 */
export async function reorderPipelineStages(
  input: ReorderStagesInput
): Promise<LeadPipeline> {
  const endpoint = "/api/v1/lead-pipeline/stages/reorder";
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      stage_ids: input.stage_ids,
      version: input.version,
    }),
  });

  if (!validatePipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after reordering stages.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Designates an active stage as the Deal conversion source.
 */
export async function setConversionStage(
  stageId: string,
  input: SetConversionStageInput
): Promise<LeadPipeline> {
  const trimmedId = stageId?.trim() ?? "";
  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Invalid stage ID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/lead-pipeline/stages/${encodeURIComponent(trimmedId)}/set-conversion`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      version: input.version,
    }),
  });

  if (!validatePipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after setting conversion stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Soft-archives an active stage and reassigns referencing leads to a target destination.
 */
export async function archivePipelineStage(
  stageId: string,
  input: ArchiveStageInput
): Promise<LeadPipeline> {
  const trimmedId = stageId?.trim() ?? "";
  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Invalid stage ID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/lead-pipeline/stages/${encodeURIComponent(trimmedId)}/archive`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      destination_stage_id: input.destination_stage_id ?? null,
      version: input.version,
    }),
  });

  if (!validatePipelineEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed pipeline response after archiving stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return sortStagesAscending(response.data);
}

/**
 * Moves an active lead to a target pipeline stage.
 */
export async function moveLeadStage(
  leadId: string,
  stageId: string
): Promise<Lead> {
  const trimmedLeadId = leadId?.trim() ?? "";
  const trimmedStageId = stageId?.trim() ?? "";

  if (!isValidUUID(trimmedLeadId) || !isValidUUID(trimmedStageId)) {
    throw new BackendApiError("Invalid UUID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/leads/${encodeURIComponent(trimmedLeadId)}/stage`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify({
      stage_id: trimmedStageId,
    }),
  });

  if (!response || typeof response !== "object") {
    throw new BackendApiError(
      "Received malformed response after moving lead stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  const res = response as Record<string, unknown>;
  return res.data as Lead;
}
