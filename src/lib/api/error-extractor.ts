/**
 * Safely extracts a user-facing error message from an API response or unknown error payload.
 * Strips raw internal exceptions, database queries, and technical diagnostics.
 */
export function extractErrorMessage(
  payload: unknown,
  fallback: string = "Please try again."
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string"
  ) {
    const rawMessage = (payload as { message: string }).message.trim();

    // Guard against technical stack traces, SQL syntax, or internal endpoints
    const isUnsafe =
      rawMessage.length === 0 ||
      rawMessage.includes("Traceback") ||
      rawMessage.includes("SELECT ") ||
      rawMessage.includes("INSERT ") ||
      rawMessage.includes("UPDATE ") ||
      rawMessage.includes("DELETE FROM") ||
      rawMessage.includes("http://") ||
      rawMessage.includes("https://") ||
      rawMessage.includes("psycopg") ||
      rawMessage.includes("sqlalchemy") ||
      rawMessage.includes("Exception:") ||
      rawMessage.includes("user_id");

    if (!isUnsafe) {
      return rawMessage;
    }
  }

  return fallback;
}
