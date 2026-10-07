import "server-only";

import { backendFetch } from "@/lib/api/backend-client";
import { ApiSuccessResponse, BackendApiError, PaginatedData } from "@/types/api";
import {
  Customer,
  CustomerStatus,
  CustomerType,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/types/customer";

export interface GetCustomersParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly status?: CustomerStatus;
  readonly customerType?: CustomerType;
}

export interface GetCustomersResult {
  readonly items: readonly Customer[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
}

/**
 * Validates the raw JSON response payload from GET /api/v1/customers.
 * Ensures the response envelope conforms to expected contract without external libraries.
 */
function validateCustomersEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<PaginatedData<Customer>> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (!Array.isArray(data.items)) {
    return false;
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
 * Retrieves paginated customers from the FastAPI backend.
 * Normalizes query string construction and pagination metadata.
 */
export async function getCustomers(
  params: GetCustomersParams
): Promise<GetCustomersResult> {
  const query = new URLSearchParams();

  // Always send valid 1-indexed pagination parameters
  query.set("page", String(Math.max(1, params.page)));
  query.set("page_size", String(Math.max(1, params.pageSize)));

  // Send optional filters only if non-empty
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.customerType) {
    query.set("customer_type", params.customerType);
  }

  const endpoint = `/api/v1/customers?${query.toString()}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateCustomersEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed customer data from backend.",
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
 * Validates the single customer response payload from POST /api/v1/customers.
 */
function validateCustomerItemEnvelope(
  payload: unknown
): payload is ApiSuccessResponse<Customer> {
  if (!payload || typeof payload !== "object") return false;

  const res = payload as Record<string, unknown>;
  if (res.success !== true || !res.data || typeof res.data !== "object") {
    return false;
  }

  const data = res.data as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    typeof data.user_id !== "string" ||
    typeof data.name !== "string" ||
    (data.customer_type !== "individual" && data.customer_type !== "company") ||
    (data.status !== "active" && data.status !== "inactive")
  ) {
    return false;
  }

  return true;
}

/**
 * Creates a new customer record via the FastAPI backend.
 * Dev user ID injection and headers are owned by backendFetch.
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<Customer> {
  const response = await backendFetch<unknown>("/api/v1/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!validateCustomerItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed customer data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return response.data;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string is a standard RFC 4122 UUID.
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Retrieves a single customer record by UUID via the FastAPI backend.
 * Validates UUID prior to issuing network requests; non-UUIDs do not call FastAPI.
 */
export async function getCustomer(customerId: string): Promise<Customer> {
  const trimmedId = customerId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Customer not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/customers/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint);

  if (!validateCustomerItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed customer data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return response.data;
}

/**
 * Partially updates an existing customer record via the FastAPI backend.
 * Validates UUID prior to issuing network requests; non-UUIDs do not call FastAPI.
 * Dev user ID injection and headers are owned by backendFetch.
 */
export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  const trimmedId = customerId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Customer not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/customers/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (!validateCustomerItemEnvelope(response)) {
    throw new BackendApiError(
      "Received malformed customer data from backend.",
      502,
      "INVALID_PAYLOAD"
    );
  }

  return response.data;
}

/**
 * Soft deletes an existing customer record via the FastAPI backend.
 * Validates UUID prior to issuing network requests; non-UUIDs do not call FastAPI.
 * Dev user ID injection and headers are owned by backendFetch.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const trimmedId = customerId?.trim() ?? "";

  if (!isValidUUID(trimmedId)) {
    throw new BackendApiError("Customer not found.", 404, "NOT_FOUND");
  }

  const endpoint = `/api/v1/customers/${encodeURIComponent(trimmedId)}`;
  const response = await backendFetch<unknown>(endpoint, {
    method: "DELETE",
  });

  if (
    !response ||
    typeof response !== "object" ||
    (response as Record<string, unknown>).success !== true
  ) {
    throw new BackendApiError(
      "Received invalid response from backend when deleting customer.",
      502,
      "INVALID_PAYLOAD"
    );
  }
}



