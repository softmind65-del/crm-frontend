import { DealStage, DEAL_STAGE_LABELS } from "@/types/deal";

/**
 * Formats a date string (e.g. "2026-10-24") into a human-readable format "24 Oct 2026".
 */
export function formatDealCloseDate(dateStr?: string | null): string {
  if (!dateStr) return "Not set";
  try {
    // If it's a plain date "YYYY-MM-DD", parse components to avoid timezone offset shifts
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const dayStr = d.getDate();
        const monthStr = d.toLocaleString("en-US", { month: "short" });
        const yearStr = d.getFullYear();
        return `${dayStr} ${monthStr} ${yearStr}`;
      }
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dayStr = d.getDate();
    const monthStr = d.toLocaleString("en-US", { month: "short" });
    const yearStr = d.getFullYear();
    return `${dayStr} ${monthStr} ${yearStr}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns the human-readable stage name.
 */
export function formatDealStage(stage: DealStage): string {
  return DEAL_STAGE_LABELS[stage] ?? stage;
}
