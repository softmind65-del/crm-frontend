import "server-only";

import { cookies } from "next/headers";
import {
  DEV_USER_ID_COOKIE,
  DEV_USER_NAME_COOKIE,
  DevSession,
  isDevAuthEnabled,
  getDevSessionCookieOptions,
  sanitizeReturnPath,
} from "./dev-session-shared";



export type { DevSession };
export {
  DEV_USER_ID_COOKIE,
  DEV_USER_NAME_COOKIE,
  isDevAuthEnabled,
  getDevSessionCookieOptions,
  sanitizeReturnPath,
};

/**
 * Reads the current development session from server-side cookies.
 * Returns the session object if both user ID and display name are present, or null otherwise.
 */
export async function getDevSession(): Promise<DevSession | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(DEV_USER_ID_COOKIE)?.value?.trim();
    const displayName = cookieStore.get(DEV_USER_NAME_COOKIE)?.value?.trim();

    if (!userId || !displayName) {
      return null;
    }

    return {
      userId,
      displayName,
    };
  } catch {
    // If called outside of a request context where cookies() is unavailable
    return null;
  }
}

/**
 * Server-only helper suitable for future FastAPI backend calls.
 * Returns the stable UUID assigned to the current development user.
 */
export async function getDevUserId(): Promise<string | null> {
  const session = await getDevSession();
  return session?.userId ?? null;
}
