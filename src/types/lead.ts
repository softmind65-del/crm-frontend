import { PaginationMeta } from "@/types/api";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted";

export type LeadSource =
  | "website"
  | "facebook"
  | "linkedin"
  | "referral"
  | "email"
  | "phone_call"
  | "walk_in"
  | "event"
  | "whatsapp"
  | "other";

/**
 * Base Lead domain representation returned by detail, create, and update endpoints.
 * Detail, create, and update responses DO NOT contain customer_name or contact_name.
 */
export interface Lead {
  readonly id: string;
  readonly user_id?: string;
  readonly customer_id: string;
  readonly contact_id: string | null;
  readonly title: string;
  readonly source: LeadSource;
  readonly status: LeadStatus;
  readonly pipeline_stage_id?: string | null;
  readonly estimated_value: number | null;
  readonly assigned_to_user_id: string | null;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Lead list item representation returned by GET /api/v1/leads,
 * which includes joined human-readable customer and contact names.
 */
export interface LeadListItem extends Lead {
  readonly customer_name: string;
  readonly contact_name: string | null;
}

export interface LeadListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly customerId?: string;
  readonly contactId?: string;
  readonly stageId?: string;
  readonly status?: LeadStatus;
  readonly source?: LeadSource;
}

export interface GetLeadsResult {
  readonly items: readonly LeadListItem[];
  readonly meta: PaginationMeta;
}

export interface CreateLeadInput {
  readonly customer_id: string;
  readonly contact_id?: string | null;
  readonly title: string;
  readonly source: LeadSource;
  readonly stage_id?: string;
  readonly status?: LeadStatus;
  readonly estimated_value?: number | null;
  readonly notes?: string | null;
}

export interface UpdateLeadInput {
  readonly contact_id?: string | null;
  readonly title?: string;
  readonly source?: LeadSource;
  readonly stage_id?: string;
  readonly status?: LeadStatus;
  readonly estimated_value?: number | null;
  readonly notes?: string | null;
}

export interface ConvertLeadToDealInput {
  readonly title: string;
  readonly value?: number | null;
  readonly expected_close_date?: string | null;
  readonly notes?: string | null;
}

export interface ConvertLeadToDealResult {
  readonly deal_id: string;
  readonly title: string;
  readonly stage: string;
  readonly customer_id: string;
  readonly contact_id: string | null;
  readonly lead_id: string;
  readonly value: number | null;
}
