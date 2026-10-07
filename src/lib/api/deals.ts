import "server-only";

import { backendFetch } from "@/lib/api/backend-client";
import { isValidUUID } from "@/lib/utils/uuid";
import { getCustomer } from "@/lib/api/customers";
import { getContact } from "@/lib/api/contacts";
import { CustomerPickerOption } from "@/components/forms/customer-picker";
import { ContactPickerOption } from "@/components/forms/contact-picker";
import { ApiSuccessResponse, BackendApiError, PaginatedData } from "@/types/api";
import {
  Deal,
  DealListParams,
  GetDealsResult,
  CreateDealInput,
  UpdateDealInput,
  DealStage,
  DEAL_STAGES,
} from "@/types/deal";

const ALLOWED_PAGE_SIZES = [10, 20, 50] as const;

interface RawBackendDeal {
  readonly id: string;
  readonly user_id?: string;
  readonly customer_id: string;
  readonly contact_id: string | null;
  readonly lead_id?: string | null;
  readonly title: string;
  readonly stage: DealStage;
  readonly pipeline_stage_id: string | null;
  readonly value: number | string | null;
  readonly expected_close_date: string | null;
  readonly assigned_to_user_id?: string | null;
  readonly notes: string | null;
  readonly closed_at?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

function validateDealsEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<PaginatedData<RawBackendDeal>> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (!Array.isArray(data.items)) {
    return false;
  }

  for (const item of data.items) {
    if (!item || typeof item !== "object") return false;
    const d = item as Record<string, unknown>;
    if (
      typeof d.id !== "string" ||
      typeof d.customer_id !== "string" ||
      typeof d.title !== "string" ||
      !DEAL_STAGES.includes(d.stage as DealStage) ||
      typeof d.created_at !== "string" ||
      typeof d.updated_at !== "string"
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

function validateDealItemEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<RawBackendDeal> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    typeof data.customer_id !== "string" ||
    typeof data.title !== "string" ||
    !DEAL_STAGES.includes(data.stage as DealStage) ||
    typeof data.created_at !== "string" ||
    typeof data.updated_at !== "string"
  ) {
    return false;
  }

  return true;
}

function normalizeDealValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : Number(val);
  return isNaN(num) ? null : num;
}

async function enrichDealsWithNames(
  rawDeals: readonly RawBackendDeal[]
): Promise<Deal[]> {
  const customerMap = new Map<string, string>();
  const contactMap = new Map<string, string>();

  const uniqueCustomerIds = Array.from(
    new Set(rawDeals.map((d) => d.customer_id).filter((id) => Boolean(id && isValidUUID(id))))
  );
  const uniqueContactIds = Array.from(
    new Set(
      rawDeals
        .map((d) => d.contact_id)
        .filter((id): id is string => Boolean(id && isValidUUID(id)))
    )
  );

  await Promise.all([
    Promise.all(
      uniqueCustomerIds.map(async (cid) => {
        try {
          const cust = await getCustomer(cid);
          if (cust?.name) {
            customerMap.set(cid, cust.name);
          }
        } catch {
          // If customer lookup fails, keep empty to use fallback
        }
      })
    ),
    Promise.all(
      uniqueContactIds.map(async (cid) => {
        try {
          const cont = await getContact(cid);
          if (cont?.name) {
            contactMap.set(cid, cont.name);
          }
        } catch {
          // If contact lookup fails, keep empty to use fallback
        }
      })
    ),
  ]);

  return rawDeals.map((d) => {
    const resolvedCustomer = customerMap.get(d.customer_id);
    const customerName =
      resolvedCustomer || (isValidUUID(d.customer_id) ? "Customer unavailable" : "Unknown customer");
    const resolvedContact = d.contact_id ? contactMap.get(d.contact_id) : null;
    const contactName = d.contact_id
      ? resolvedContact || (isValidUUID(d.contact_id) ? "Contact unavailable" : "Unknown contact")
      : null;

    return {
      id: d.id,
      user_id: d.user_id,
      customer_id: d.customer_id,
      customer_name: customerName,
      contact_id: d.contact_id,
      contact_name: contactName,
      lead_id: d.lead_id ?? null,
      title: d.title,
      stage: d.stage,
      pipeline_stage_id: d.pipeline_stage_id ?? "",
      value: normalizeDealValue(d.value),
      expected_close_date: d.expected_close_date ?? null,
      assigned_to_user_id: d.assigned_to_user_id ?? null,
      notes: d.notes ?? null,
      closed_at: d.closed_at ?? null,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  });
}

async function enrichSingleDealWithNames(
  rawDeal: RawBackendDeal
): Promise<Deal> {
  const [enriched] = await enrichDealsWithNames([rawDeal]);
  return enriched;
}

/**
 * Retrieves paginated deals from the FastAPI backend through BFF.
 */
export async function getDeals(
  params: DealListParams
): Promise<GetDealsResult> {
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

  if (params.leadId?.trim()) {
    query.set("lead_id", params.leadId.trim());
  }

  if (params.stageId?.trim()) {
    query.set("stage_id", params.stageId.trim());
  }

  if (params.stage) {
    query.set("stage", params.stage);
  }

  const endpoint = `/api/v1/deals?${query.toString()}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateDealsEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  const { items, metafields } = response.data;
  const enrichedItems = await enrichDealsWithNames(items);

  return {
    items: enrichedItems,
    meta: {
      total: metafields.total,
      page: metafields.page,
      pageSize: metafields.page_size,
      totalPages: metafields.total_pages,
    },
  };
}

/**
 * Retrieves a single deal by UUID via the FastAPI backend.
 */
export async function getDeal(dealId: string): Promise<Deal> {
  const trimmedId = dealId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Deal not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/deals/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateDealItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return enrichSingleDealWithNames(response.data);
}

/**
 * Creates a new deal record via the FastAPI backend.
 * Strips owner, stage, stage_id so backend places it in configured entry stage.
 */
export async function createDeal(
  input: CreateDealInput
): Promise<Deal> {
  const payload: Record<string, unknown> = {
    customer_id: input.customer_id,
    title: input.title.trim(),
  };

  if (input.contact_id !== undefined && input.contact_id !== null && input.contact_id !== "") {
    payload.contact_id = input.contact_id;
  }
  if (input.value !== undefined && input.value !== null) {
    payload.value = input.value;
  }
  if (input.expected_close_date !== undefined && input.expected_close_date !== null && input.expected_close_date !== "") {
    payload.expected_close_date = input.expected_close_date;
  }
  if (input.notes !== undefined && input.notes !== null && input.notes !== "") {
    payload.notes = input.notes;
  }

  const response = await backendFetch<unknown>("/api/v1/deals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!validateDealItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return enrichSingleDealWithNames(response.data);
}

/**
 * Partially updates an existing deal record via the FastAPI backend.
 */
export async function updateDeal(
  dealId: string,
  input: UpdateDealInput
): Promise<Deal> {
  const trimmedId = dealId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Deal not found.", 404, "NOT_FOUND");
  }

  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.customer_id !== undefined) payload.customer_id = input.customer_id;
  if (input.contact_id !== undefined) payload.contact_id = input.contact_id;
  if (input.value !== undefined) payload.value = input.value;
  if (input.expected_close_date !== undefined) payload.expected_close_date = input.expected_close_date;
  if (input.notes !== undefined) payload.notes = input.notes;

  const endpoint = `/api/v1/deals/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!validateDealItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed deal data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return enrichSingleDealWithNames(response.data);
}

/**
 * Moves an active deal to a target pipeline stage.
 */
export async function moveDealStage(
  dealId: string,
  stageId: string
): Promise<Deal> {
  const trimmedDealId = dealId?.trim() ?? "";
  const trimmedStageId = stageId?.trim() ?? "";

  if (!isValidUUID(trimmedDealId) || !isValidUUID(trimmedStageId)) {
    throw new BackendApiError("Invalid UUID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/deals/${encodeURIComponent(trimmedDealId)}/stage`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify({
      stage_id: trimmedStageId,
    }),
  });

  if (!validateDealItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed response after moving deal stage.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return enrichSingleDealWithNames(response.data);
}

/**
 * Reopens a closed (Won or Lost) deal by moving it to the configured entry stage.
 */
export async function reopenDeal(dealId: string): Promise<Deal> {
  const trimmedDealId = dealId?.trim() ?? "";

  if (!isValidUUID(trimmedDealId)) {
    throw new BackendApiError("Invalid UUID format.", 400, "INVALID_UUID");
  }

  const endpoint = `/api/v1/deals/${encodeURIComponent(trimmedDealId)}/reopen`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "POST",
  });

  if (!validateDealItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed response after reopening deal.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return enrichSingleDealWithNames(response.data);
}

/**
 * Soft deletes an existing deal record via the FastAPI backend.
 */
export async function deleteDeal(dealId: string): Promise<void> {
  const trimmedId = dealId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Deal not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/deals/${encodeURIComponent(trimmedId)}`;
  await backendFetch<unknown>(endpoint, {
    method: "DELETE",
  });
}

export interface LoadedDealsPageData {
  readonly data: GetDealsResult;
  readonly sanitizedSearch?: string;
  readonly sanitizedCustomerId?: string;
  readonly sanitizedContactId?: string;
  readonly sanitizedStageId?: string;
  readonly sanitizedStage?: DealStage;
  readonly initialCustomerOption: CustomerPickerOption | null;
  readonly initialContactOption: ContactPickerOption | null;
  readonly redirectUrl: string | null;
}

/**
 * Server-side helper to load Deals page data with full query sanitation,
 * pre-fetched picker options, and URL correction redirects.
 */
export async function loadDealsPageData(
  resolvedParams: { [key: string]: string | string[] | undefined },
  basePath: string = "/deals"
): Promise<LoadedDealsPageData> {
  const rawSearch =
    typeof resolvedParams.search === "string"
      ? resolvedParams.search.trim()
      : undefined;
  const sanitizedSearch = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

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

  const rawStage =
    typeof resolvedParams.stage === "string"
      ? resolvedParams.stage.trim()
      : undefined;
  const sanitizedStage: DealStage | undefined =
    rawStage && DEAL_STAGES.includes(rawStage as DealStage)
      ? (rawStage as DealStage)
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

  const data = await getDeals({
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    search: sanitizedSearch,
    customerId: sanitizedCustomerId,
    contactId: sanitizedContactId,
    stageId: sanitizedStageId,
    stage: sanitizedStage,
  });

  let redirectUrl: string | null = null;

  // Safe page correction: page out of bounds
  if (data.meta.total > 0 && sanitizedPage > data.meta.totalPages) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedCustomerId) redirectQuery.set("customer_id", sanitizedCustomerId);
    if (sanitizedContactId) redirectQuery.set("contact_id", sanitizedContactId);
    if (sanitizedStageId) redirectQuery.set("stage_id", sanitizedStageId);
    if (sanitizedStage) redirectQuery.set("stage", sanitizedStage);
    redirectQuery.set("page", String(data.meta.totalPages));
    if (sanitizedPageSize !== 10) {
      redirectQuery.set("page_size", String(sanitizedPageSize));
    }
    redirectUrl = `${basePath}?${redirectQuery.toString()}`;
  } else if (data.meta.total === 0 && sanitizedPage > 1) {
    const redirectQuery = new URLSearchParams();
    if (sanitizedSearch) redirectQuery.set("search", sanitizedSearch);
    if (sanitizedCustomerId) redirectQuery.set("customer_id", sanitizedCustomerId);
    if (sanitizedContactId) redirectQuery.set("contact_id", sanitizedContactId);
    if (sanitizedStageId) redirectQuery.set("stage_id", sanitizedStageId);
    if (sanitizedStage) redirectQuery.set("stage", sanitizedStage);
    redirectQuery.set("page", "1");
    if (sanitizedPageSize !== 10) {
      redirectQuery.set("page_size", String(sanitizedPageSize));
    }
    redirectUrl = `${basePath}?${redirectQuery.toString()}`;
  }

  return {
    data,
    sanitizedSearch,
    sanitizedCustomerId,
    sanitizedContactId,
    sanitizedStageId,
    sanitizedStage,
    initialCustomerOption,
    initialContactOption,
    redirectUrl,
  };
}
