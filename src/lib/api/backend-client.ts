import "server-only";

import { getDevUserId } from "@/lib/auth/dev-session";
import { BackendApiError } from "@/types/api";

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Validates and normalizes the server-side BACKEND_API_URL environment variable.
 * Throws a configuration error if missing or invalid.
 */
function getNormalizedBackendUrl(): string {
  const rawUrl = process.env.BACKEND_API_URL?.trim();

  if (!rawUrl) {
    throw new BackendApiError(
      "Backend API URL is not configured.",
      500,
      "CONFIG_ERROR"
    );
  }

  try {
    const parsed = new URL(rawUrl);
    // Ensure scheme is http or https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    // Remove trailing slashes
    return rawUrl.replace(/\/+$/, "");
  } catch {
    throw new BackendApiError(
      "Backend API URL is malformed.",
      500,
      "CONFIG_ERROR"
    );
  }
}


export async function backendFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getNormalizedBackendUrl();

  // Retrieve current development user identity server-side (temporary until Keycloak JWT sub is used)
  const userId = await getDevUserId();
  if (!userId) {
    throw new BackendApiError(
      "Development user session is required.",
      401,
      "UNAUTHORIZED"
    );
  }

  // Ensure normalized path starts with a single '/'
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${baseUrl}${normalizedPath}`;

  // Configure timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  // Construct request headers safely
  const headers = new Headers(options?.headers);
  headers.set("X-User-ID", userId);
  headers.set("Accept", "application/json");

  // Only set Content-Type if a request body is present and not already specified
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: options?.signal ?? controller.signal,
      cache: options?.cache ?? "no-store",
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = "An error occurred while contacting the backend service.";
      let errorCode: string | null = null;

      try {
        const errorBody: unknown = await response.json();
        if (
          errorBody &&
          typeof errorBody === "object" &&
          "message" in errorBody &&
          typeof (errorBody as { message: unknown }).message === "string"
        ) {
          errorMessage = (errorBody as { message: string }).message;
        }
        if (
          errorBody &&
          typeof errorBody === "object" &&
          "errorCode" in errorBody &&
          typeof (errorBody as { errorCode: unknown }).errorCode === "string"
        ) {
          errorCode = (errorBody as { errorCode: string }).errorCode;
        }
      } catch {
        // Response was not JSON; use default message
      }

      throw new BackendApiError(
        errorMessage,
        response.status,
        errorCode
      );
    }

    // Parse JSON response safely
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new BackendApiError(
        "Invalid response format received from backend.",
        502,
        "INVALID_RESPONSE"
      );
    }

    return responseData as T;
  } catch (error: unknown) {
    if (error instanceof BackendApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new BackendApiError(
        "Request to backend timed out.",
        504,
        "GATEWAY_TIMEOUT"
      );
    }

    // Network error or connection refused
    throw new BackendApiError(
      "Unable to connect to the backend service.",
      503,
      "SERVICE_UNAVAILABLE"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
