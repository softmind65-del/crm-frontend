export type CustomerType = "individual" | "company";
export type CustomerStatus = "active" | "inactive";

export interface Customer {
  readonly id: string;
  readonly user_id: string;
  readonly customer_type: CustomerType;
  readonly name: string;
  readonly company_name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly status: CustomerStatus;
  readonly assigned_to_user_id: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CreateCustomerInput {
  readonly customer_type: CustomerType;
  readonly name: string;
  readonly company_name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly address?: string | null;
  readonly status: CustomerStatus;
}

export interface UpdateCustomerInput {
  readonly customer_type?: CustomerType;
  readonly name?: string;
  readonly company_name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly address?: string | null;
  readonly status?: CustomerStatus;
}

