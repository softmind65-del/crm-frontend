

export const DEV_USER_ID_COOKIE = "accdoo_dev_user_id";
export const DEV_USER_NAME_COOKIE = "accdoo_dev_user_name";



export const DEV_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const DEV_DISPLAY_NAME_MIN_LENGTH = 2;
export const DEV_DISPLAY_NAME_MAX_LENGTH = 60;

export interface DevSession {
  readonly userId: string;
  readonly displayName: string;
}

export type DevIdentityValidation =
  | {
      readonly ok: true;
      readonly value: string;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };


export function validateDevIdentity(raw: unknown): DevIdentityValidation {
  if (typeof raw !== "string") {
    return {
      ok: false,
      message: "Please enter a development username.",
    };
  }

  const normalized = raw.trim().toLowerCase();

  if (!normalized) {
    return {
      ok: false,
      message: "Please enter a development username.",
    };
  }

  if (normalized.length < DEV_DISPLAY_NAME_MIN_LENGTH) {
    return {
      ok: false,
      message: `Development username must be at least ${DEV_DISPLAY_NAME_MIN_LENGTH} characters.`,
    };
  }

  if (normalized.length > DEV_DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Development username cannot exceed ${DEV_DISPLAY_NAME_MAX_LENGTH} characters.`,
    };
  }

  const identifierRegex = /^[a-z0-9._-]+$/;
  if (!identifierRegex.test(normalized)) {
    return {
      ok: false,
      message: "Development username can only contain letters, numbers, hyphens, underscores, and dots.",
    };
  }

  return {
    ok: true,
    value: normalized,
  };
}

/**
 * Validates and sanitizes internal return paths to prevent open redirect vulnerabilities.
 * Only accepts relative paths starting with a single '/' and rejects protocols or double slashes.
 */
export function sanitizeReturnPath(path: string | null | undefined): string {
  if (!path) {
    return "/";
  }

  const trimmed = path.trim();

  // Must start with '/' but not '//' or '/\'
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\")
  ) {
    // Disallow external schemes (http:, https:, javascript:, data:, etc.)
    if (!trimmed.includes(":") && !trimmed.toLowerCase().includes("javascript")) {
      return trimmed;
    }
  }

  return "/";
}

/**
 * Checks if the development authentication guard is enabled.
 * Defaults to true unless explicitly disabled via DEV_AUTH_ENABLED=false.
 */
export function isDevAuthEnabled(): boolean {
  if (process.env.DEV_AUTH_ENABLED === "false") {
    return false;
  }
  return true;
}

/**
 * Returns cookie security options for development session persistence.
 */
export function getDevSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: DEV_SESSION_MAX_AGE_SECONDS,
  };
}
