export type ContactStatus = "active" | "inactive";

/**
 * Base Contact domain representation returned by detail, create, and update endpoints.
 * Detail, create, and update responses DO NOT contain customer_name.
 */
export interface Contact {
  readonly id: string;
  readonly user_id?: string;
  readonly customer_id: string;
  readonly name: string;
  readonly job_title?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly mobile?: string | null;
  readonly status: ContactStatus;
  readonly is_primary: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Contact list item representation returned by GET /api/v1/contacts,
 * which includes the joined customer primary display name.
 */
export interface ContactListItem extends Contact {
  readonly customer_name: string;
}

export interface ContactListParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search?: string;
  readonly customerId?: string;
  readonly status?: ContactStatus;
  readonly isPrimary?: boolean;
}

export interface GetContactsResult {
  readonly items: readonly ContactListItem[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
}

export interface CreateContactInput {
  readonly customer_id: string;
  readonly name: string;
  readonly job_title?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly mobile?: string | null;
  readonly status?: ContactStatus;
  readonly is_primary?: boolean;
}

export interface UpdateContactInput {
  readonly name?: string;
  readonly job_title?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly mobile?: string | null;
  readonly status?: ContactStatus;
  readonly is_primary?: boolean;
}
