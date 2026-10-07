
export interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly page_size: number;
  readonly total_pages: number;
}

export interface PaginatedData<T> {
  readonly items: readonly T[];
  readonly metafields: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly message: string;
  readonly errorCode: null;
  readonly data: T;
}

export interface BackendErrorResponse {
  readonly success: false;
  readonly message: string;
  readonly errorCode: string | null;
  readonly data: unknown;
}

/**
 * Normalized server-side error for API client calls.
 * Safe for client-facing error boundary consumption (never exposes sensitive backend internals).
 */
export class BackendApiError extends Error {
  readonly status: number;
  readonly errorCode: string | null;
  readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    errorCode: string | null = null,
    requestId?: string
  ) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.requestId = requestId;
    Object.setPrototypeOf(this, BackendApiError.prototype);
  }
}
