import "server-only";

import { backendFetch } from "@/lib/api/backend-client";
import { isValidUUID } from "@/lib/utils/uuid";
import { ApiSuccessResponse, BackendApiError, PaginatedData } from "@/types/api";
import {
  Contact,
  ContactListItem,
  ContactListParams,
  GetContactsResult,
  CreateContactInput,
  UpdateContactInput,
} from "@/types/contact";

/**
 * Validates the raw JSON response payload from GET /api/v1/contacts.
 * Requires each item to include joined customer_name.
 */
function validateContactsEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<PaginatedData<ContactListItem>> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (!Array.isArray(data.items)) {
    return false;
  }

  // Validate items structure including customer_name
  for (const item of data.items) {
    if (!item || typeof item !== "object") return false;
    const c = item as Record<string, unknown>;
    if (
      typeof c.id !== "string" ||
      typeof c.customer_id !== "string" ||
      typeof c.customer_name !== "string" ||
      typeof c.name !== "string" ||
      (c.status !== "active" && c.status !== "inactive") ||
      typeof c.is_primary !== "boolean" ||
      typeof c.created_at !== "string" ||
      typeof c.updated_at !== "string"
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
 * Validates the single contact response payload from POST / PATCH / GET /api/v1/contacts/{id}.
 * Does NOT require customer_name since base ContactResponse does not return it.
 */
function validateContactItemEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<Contact> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    typeof data.user_id !== "string" ||
    typeof data.customer_id !== "string" ||
    typeof data.name !== "string" ||
    (data.status !== "active" && data.status !== "inactive") ||
    typeof data.is_primary !== "boolean" ||
    typeof data.created_at !== "string" ||
    typeof data.updated_at !== "string"
  ) {
    return false;
  }

  return true;
}

/**
 * Retrieves paginated contacts from the FastAPI backend.
 */
export async function getContacts(
  params: ContactListParams
): Promise<GetContactsResult> {
  const query = new URLSearchParams();

  query.set("page", String(Math.max(1, params.page)));
  query.set("page_size", String(Math.max(1, params.pageSize)));

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.customerId?.trim()) {
    query.set("customer_id", params.customerId.trim());
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (typeof params.isPrimary === "boolean") {
    query.set("is_primary", String(params.isPrimary));
  }

  const endpoint = `/api/v1/contacts?${query.toString()}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateContactsEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed contact data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  const { items, metafields } = response.data;

  return {
    items,
    meta: {
      total: metafields.total,
      page: metafields.page,
      pageSize: metafields.page_size,
      totalPages: metafields.total_pages,
    },
  };
}

/**
 * Retrieves a single contact by UUID via the FastAPI backend.
 */
export async function getContact(contactId: string): Promise<Contact> {
  const trimmedId = contactId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Contact not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/contacts/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateContactItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed contact data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return response.data;
}

/**
 * Creates a new contact record via the FastAPI backend.
 */
export async function createContact(
  input: CreateContactInput
): Promise<Contact> {
  const response = await backendFetch<unknown>("/api/v1/contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!validateContactItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed contact data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return response.data;
}

/**
 * Partially updates an existing contact record via the FastAPI backend.
 */
export async function updateContact(
  contactId: string,
  input: UpdateContactInput
): Promise<Contact> {
  const trimmedId = contactId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Contact not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/contacts/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!validateContactItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed contact data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return response.data;
}

/**
 * Soft deletes an existing contact record via the FastAPI backend.
 */
export async function deleteContact(contactId: string): Promise<void> {
  const trimmedId = contactId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Contact not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/contacts/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "DELETE",
  });

  if (
    !response ||
    typeof response !== "object" ||
    (response as Record<string, unknown>).success !== true
  ) {
    throw new BackendApiError(
      "Received invalid response from backend when deleting contact.",
      502,
      "INVALID_PAYLOAD"
    );
  }
}
