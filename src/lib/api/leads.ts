import "server-only";

import { backendFetch } from "@/lib/api/backend-client";
import { isValidUUID } from "@/lib/utils/uuid";
import { getCustomer } from "@/lib/api/customers";
import { getContact } from "@/lib/api/contacts";
import { CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPickerOption } from "@/components/forms/contact-picker";
import { ApiSuccessResponse, BackendApiError, PaginatedData } from "@/types/api";
import {
  Lead,
  LeadListItem,
  LeadListParams,
  GetLeadsResult,
  CreateLeadInput,
  UpdateLeadInput,
  ConvertLeadToDealInput,
  ConvertLeadToDealResult,
  LeadSource,
  LeadStatus,
} from "@/types/lead";
import { ALL_LEAD_STATUSES, VALID_LEAD_SOURCES } from "@/lib/validation/lead";

const ALLOWED_PAGE_SIZES = [10, 20, 50] as const;

/**
 * Validates the raw JSON response payload from GET /api/v1/leads.
 * Requires each item to include joined customer_name and contact_name.
 */
function validateLeadsEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<PaginatedData<LeadListItem>> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (!Array.isArray(data.items)) {
    return false;
  }

  // Validate items structure including customer_name and contact_name
  for (const item of data.items) {
    if (!item || typeof item !== "object") return false;
    const l = item as Record<string, unknown>;
    if (
      typeof l.id !== "string" ||
      typeof l.customer_id !== "string" ||
      typeof l.customer_name !== "string" ||
      (l.contact_id !== null && typeof l.contact_id !== "string") ||
      (l.contact_name !== null && typeof l.contact_name !== "string") ||
      typeof l.title !== "string" ||
      !VALID_LEAD_SOURCES.includes(l.source as LeadSource) ||
      !ALL_LEAD_STATUSES.includes(l.status as LeadStatus) ||
      (l.pipeline_stage_id !== undefined && l.pipeline_stage_id !== null && typeof l.pipeline_stage_id !== "string") ||
      typeof l.created_at !== "string" ||
      typeof l.updated_at !== "string"
    ) {
      return false;
    }
  }

  const meta = data.metafields;
  if (!meta || typeof meta !== "object") {
    return false;
  }

  const metaObj = meta as Record<string, unknown>;
  if (
    typeof metaObj.total !== "number" ||
    typeof metaObj.page !== "number" ||
    typeof metaObj.page_size !== "number" ||
    typeof metaObj.total_pages !== "number"
  ) {
    return false;
  }

  return true;
}

/**
 * Validates the single lead response payload from POST / PATCH / GET /api/v1/leads/{id}.
 * Does NOT require customer_name or contact_name since LeadResponse does not return them.
 */
function validateLeadItemEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<Lead> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    typeof data.customer_id !== "string" ||
    (data.contact_id !== null && typeof data.contact_id !== "string") ||
    typeof data.title !== "string" ||
    !VALID_LEAD_SOURCES.includes(data.source as LeadSource) ||
    !ALL_LEAD_STATUSES.includes(data.status as LeadStatus) ||
    (data.pipeline_stage_id !== undefined && data.pipeline_stage_id !== null && typeof data.pipeline_stage_id !== "string") ||
    typeof data.created_at !== "string" ||
    typeof data.updated_at !== "string"
  ) {
    return false;
  }

  return true;
}

/**
 * Validates the Deal response envelope from POST /api/v1/leads/{id}/convert-to-deal.
 */
function validateConvertDealEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    typeof data.title !== "string" ||
    typeof data.stage !== "string"
  ) {
    return false;
  }

  return true;
}

function normalizeEstimatedValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : Number(val);
  return isNaN(num) ? null : num;
}

/**
 * Retrieves paginated leads from the FastAPI backend.
 */
export async function getLeads(
  params: LeadListParams
): Promise<GetLeadsResult> {
  const query = new URLSearchParams();

  query.set("page", String(Math.max(1, params.page)));
  query.set("page_size", String(Math.max(1, params.pageSize)));

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.customerId?.trim()) {
    query.set("customer_id", params.customerId.trim());
  }

  if (params.contactId?.trim()) {
    query.set("contact_id", params.contactId.trim());
  }

  if (params.stageId?.trim()) {
    query.set("stage_id", params.stageId.trim());
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.source) {
    query.set("source", params.source);
  }

  const endpoint = `/api/v1/leads?${query.toString()}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateLeadsEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed lead data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  const { items, metafields } = response.data;

  // Reliably normalize estimated_value and pipeline_stage_id
  const normalizedItems: LeadListItem[] = items.map((item) => ({
    ...item,
    pipeline_stage_id:
      typeof item.pipeline_stage_id === "string" ? item.pipeline_stage_id : null,
    estimated_value: normalizeEstimatedValue(item.estimated_value),
  }));

  return {
    items: normalizedItems,
    meta: {
      total: metafields.total,
      page: metafields.page,
      page_size: metafields.page_size,
      total_pages: metafields.total_pages,
    },
  };
}

/**
 * Retrieves a single lead by UUID via the FastAPI backend.
 */
export async function getLead(leadId: string): Promise<Lead> {
  const trimmedId = leadId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Lead not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/leads/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateLeadItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed lead data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return {
    ...response.data,
    pipeline_stage_id:
      typeof response.data.pipeline_stage_id === "string"
        ? response.data.pipeline_stage_id
        : null,
    estimated_value: normalizeEstimatedValue(response.data.estimated_value),
  };
}

/**
 * Creates a new lead record via the FastAPI backend.
 */
export async function createLead(
  input: CreateLeadInput
): Promise<Lead> {
  // Ensure stage_id and status are NEVER sent together in the same request
  const payload: Record<string, unknown> = {
    customer_id: input.customer_id,
    title: input.title,
    source: input.source,
  };
  if (input.contact_id !== undefined) payload.contact_id = input.contact_id;
  if (input.estimated_value !== undefined) payload.estimated_value = input.estimated_value;
  if (input.notes !== undefined) payload.notes = input.notes;

  if (input.stage_id) {
    payload.stage_id = input.stage_id;
  } else if (input.status) {
    payload.status = input.status;
  }

  const response = await backendFetch<unknown>("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!validateLeadItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed lead data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return {
    ...response.data,
    pipeline_stage_id:
      typeof response.data.pipeline_stage_id === "string"
        ? response.data.pipeline_stage_id
        : null,
    estimated_value: normalizeEstimatedValue(response.data.estimated_value),
  };
}

/**
 * Partially updates an existing lead record via the FastAPI backend.
 */
export async function updateLead(
  leadId: string,
  input: UpdateLeadInput
): Promise<Lead> {
  const trimmedId = leadId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Lead not found.", 404, "NOT_FOUND");
  }

  // Ensure stage_id and status are NEVER sent together in the same request
  const payload: Record<string, unknown> = { ...input };
  if (payload.stage_id) {
    delete payload.status;
  }

  const endpoint = `/api/v1/leads/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!validateLeadItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed lead data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return {
    ...response.data,
    pipeline_stage_id:
      typeof response.data.pipeline_stage_id === "string"
        ? response.data.pipeline_stage_id
        : null,
    estimated_value: normalizeEstimatedValue(response.data.estimated_value),
  };
}

/**
 * Soft deletes an existing lead record via the FastAPI backend.
 */
export async function deleteLead(leadId: string): Promise<void> {
  const trimmedId = leadId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Lead not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/leads/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "DELETE",
  });

  if (
    !response ||
    typeof response !== "object" ||
    (response as Record<string, unknown>).success !== true
  ) {
    throw new BackendApiError(
      "Received invalid response from backend when deleting lead.",
      502,
      "INVALID_PAYLOAD"
    );
  }
}

/**
 * Converts a qualified lead into a deal via the FastAPI backend.
 */
export async function convertLeadToDeal(
  leadId: string,
  input: ConvertLeadToDealInput
): Promise<ConvertLeadToDealResult> {
  const trimmedId = leadId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Lead not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/leads/${encodeURIComponent(trimmedId)}/convert-to-deal`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!validateConvertDealEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  const data = response.data;

  return {
    deal_id: typeof data.id === "string" ? data.id : "",
    title: typeof data.title === "string" ? data.title : "",
    stage: typeof data.stage === "string" ? data.stage : "new",
    customer_id: typeof data.customer_id === "string" ? data.customer_id : "",
    contact_id: typeof data.contact_id === "string" ? data.contact_id : null,
    lead_id: typeof data.lead_id === "string" ? data.lead_id : trimmedId,
    value: normalizeEstimatedValue(data.value),
  };
}

export interface SharedLeadsPageData {
  readonly data: GetLeadsResult;
  readonly sanitizedSearch?: string;
  readonly sanitizedCustomerId?: string;
  readonly sanitizedContactId?: string;
  readonly sanitizedStageId?: string;
  readonly sanitizedStatus?: LeadStatus;
  readonly sanitizedSource?: LeadSource;
  readonly initialCustomerOption: CustomerPickerOption | null;
  readonly initialContactOption: ContactPickerOption | null;
  readonly redirectUrl: string | null;
}

/**
 * Shared server-side parameter parser and data loader for /leads and /leads/pipeline.
 * Eliminates duplicate parameter parsing, customer/contact name pre-resolution, and safe-page math.
 */
export async function loadLeadsPageData(
  resolvedParams: { [key: string]: string | string[] | undefined },
  basePath: string = "/leads"
): Promise<SharedLeadsPageData> {
  const rawSearch =
    typeof resolvedParams.search === "string"
      ? resolvedParams.search.trim()
      : undefined;
  const sanitizedSearch = rawSearch ? rawSearch : undefined;

  const rawCustomerId =
    typeof resolvedParams.customer_id === "string"
      ? resolvedParams.customer_id.trim()
      : undefined;
  const sanitizedCustomerId =
    rawCustomerId && isValidUUID(rawCustomerId) ? rawCustomerId : undefined;

  const rawContactId =
    typeof resolvedParams.contact_id === "string"
      ? resolvedParams.contact_id.trim()
      : undefined;
  const sanitizedContactId =
    rawContactId && isValidUUID(rawContactId) ? rawContactId : undefined;

  const rawStageId =
    typeof resolvedParams.stage_id === "string"
      ? resolvedParams.stage_id.trim()
      : undefined;
  const sanitizedStageId =
    rawStageId && isValidUUID(rawStageId) ? rawStageId : undefined;

  const rawStatus =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status.trim()
      : undefined;
  const sanitizedStatus: LeadStatus | undefined =
    rawStatus && ALL_LEAD_STATUSES.includes(rawStatus as LeadStatus)
      ? (rawStatus as LeadStatus)
      : undefined;

  const rawSource =
    typeof resolvedParams.source === "string"
      ? resolvedParams.source.trim()
      : undefined;
  const sanitizedSource: LeadSource | undefined =
    rawSource && VALID_LEAD_SOURCES.includes(rawSource as LeadSource)
      ? (rawSource as LeadSource)
      : undefined;

  const rawPage =
    typeof resolvedParams.page === "string"
      ? parseInt(resolvedParams.page, 10)
      : 1;
  const sanitizedPage = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawPageSize =
    typeof resolvedParams.page_size === "string"
      ? parseInt(resolvedParams.page_size, 10)
      : 10;
  const sanitizedPageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(
    rawPageSize
  )
    ? rawPageSize
    : 10;

  // Resolve customer name server-side if customer_id filter is active
  let initialCustomerOption: CustomerPickerOption | null = null;
  if (sanitizedCustomerId) {
    try {
      const customer = await getCustomer(sanitizedCustomerId);
      initialCustomerOption = {
        value: customer.id,
        label: customer.name,
        sublabel: customer.company_name ?? null,
      };
    } catch {
      initialCustomerOption = {
        value: sanitizedCustomerId,
        label: "Customer",
        sublabel: null,
      };
    }
  }

  // Resolve contact name server-side if contact_id filter is active
  let initialContactOption: ContactPickerOption | null = null;
  if (sanitizedContactId) {
    try {
      const contact = await getContact(sanitizedContactId);
      initialContactOption = {
        value: contact.id,
        label: contact.name,
        sublabel: contact.job_title ?? null,
        customerId: contact.customer_id,
      };
    } catch {
      initialContactOption = {
        value: sanitizedContactId,
        label: "Contact",
        sublabel: null,
      };
    }
  }

  const data = await getLeads({
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    search: sanitizedSearch,
    customerId: sanitizedCustomerId,
    contactId: sanitizedContactId,
    stageId: sanitizedStageId,
    status: sanitizedStatus,
    source: sanitizedSource,
  });

  let redirectUrl: string | null = null;

  // Safe page correction: page out of bounds
  if (data.meta.total > 0 && sanitizedPage > data.meta.total_pages) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedCustomerId) redirectQuery.set("customer_id", sanitizedCustomerId);
    if (sanitizedContactId) redirectQuery.set("contact_id", sanitizedContactId);
    if (sanitizedStageId) redirectQuery.set("stage_id", sanitizedStageId);
    if (sanitizedStatus) redirectQuery.set("status", sanitizedStatus);
    if (sanitizedSource) redirectQuery.set("source", sanitizedSource);
    redirectQuery.set("page", String(data.meta.total_pages));
    if (sanitizedPageSize !== 10) {
      redirectQuery.set("page_size", String(sanitizedPageSize));
    }
    redirectUrl = `${basePath}?${redirectQuery.toString()}`;
  } else if (data.meta.total === 0 && sanitizedPage > 1) {
    // Safe page correction: empty search/filter results on page > 1
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedCustomerId) redirectQuery.set("customer_id", sanitizedCustomerId);
    if (sanitizedContactId) redirectQuery.set("contact_id", sanitizedContactId);
    if (sanitizedStageId) redirectQuery.set("stage_id", sanitizedStageId);
    if (sanitizedStatus) redirectQuery.set("status", sanitizedStatus);
    if (sanitizedSource) redirectQuery.set("source", sanitizedSource);
    if (sanitizedPageSize !== 10) {
      redirectQuery.set("page_size", String(sanitizedPageSize));
    }
    redirectUrl = redirectQuery.toString()
      ? `${basePath}?${redirectQuery.toString()}`
      : basePath;
  }

  return {
    data,
    sanitizedSearch,
    sanitizedCustomerId,
    sanitizedContactId,
    sanitizedStageId,
    sanitizedStatus,
    sanitizedSource,
    initialCustomerOption,
    initialContactOption,
    redirectUrl,
  };
}
