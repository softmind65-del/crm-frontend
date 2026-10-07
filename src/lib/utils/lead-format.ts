import { LeadSource, LeadStatus } from "@/types/lead";
import { BadgeVariant } from "@/components/ui/badge";

/**
 * Ordered list of statuses for the Leads Pipeline (Kanban) view.
 */
export const LEAD_PIPELINE_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
] as const;

/**
 * Normal statuses available for manual selection during create and edit.
 * Converted is strictly a system/business outcome from Deal conversion.
 */
export const LEAD_NORMAL_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
] as const;

/**
 * Format raw backend source key into user-friendly display text.
 */
export function formatLeadSource(source: LeadSource): string {
  switch (source) {
    case "website":
      return "Website";
    case "facebook":
      return "Facebook";
    case "linkedin":
      return "LinkedIn";
    case "referral":
      return "Referral";
    case "email":
      return "Email";
    case "phone_call":
      return "Phone Call";
    case "walk_in":
      return "Walk-in";
    case "event":
      return "Event";
    case "whatsapp":
      return "WhatsApp";
    case "other":
      return "Other";
    default:
      return source;
  }
}

/**
 * Format raw backend status key into user-friendly display text.
 */
export function formatLeadStatus(status: LeadStatus): string {
  switch (status) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "qualified":
      return "Qualified";
    case "unqualified":
      return "Unqualified";
    case "converted":
      return "Converted";
    default:
      return status;
  }
}

/**
 * Get the restrained Badge variant for a LeadStatus.
 */
export function getLeadStatusBadgeVariant(status: LeadStatus): BadgeVariant {
  switch (status) {
    case "new":
      return "info";
    case "contacted":
      return "info";
    case "qualified":
      return "success";
    case "unqualified":
      return "neutral";
    case "converted":
      return "success";
    default:
      return "neutral";
  }
}
